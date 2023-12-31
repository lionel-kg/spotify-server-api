import express from 'express';
const router = express.Router();
import {prisma} from '../config/db';
import {upload} from '../services/upload.service';
import {
  getWavMetadata,
  processAudioFilesInDirectory,
  getMetadata,
} from '../services/audio.service';
import cloudinary from '../config/cloudinary';
import streamifier from 'streamifier';

import Redis from 'ioredis';
import redisMiddleware from '../middleware/redis';
const redis = new Redis({enableAutoPipelining: true});

// Create Audio
router.post('/', async (req, res) => {
  try {
    const audio = await prisma.audio.create({data: req.body});
    await redis.del(`/audio`);
    await redis.del(`/album/${req.body.albumId}`);
    await redis.del(`/artist/${req.body.artistId}`);

    res.status(201).json(audio);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Read Audios with Pagination
// Read Audios with Pagination
router.get('/pagination', redisMiddleware, async (req, res) => {
  try {
    // Paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Nombre d'éléments par page

    // Calcul de l'offset pour la requête
    const offset = (page - 1) * limit;

    // Requête pour récupérer les éléments paginés
    const audios = await prisma.audio.findMany({
      include: {
        album: true,
        artist: true,
      },
      skip: offset,
      take: limit,
    });

    // Requête pour récupérer le nombre total d'éléments sans la pagination
    const nbResults = await prisma.audio.count();

    // Enregistrez les données dans le cache Redis avec une clé unique basée sur les paramètres de pagination
    const cacheKey = `${req.originalUrl}_page_${page}_limit_${limit}`;
    await redis.setex(cacheKey, 3600, JSON.stringify(audios));

    res.status(200).json({audios, nbResults});
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Read Audios
router.get('/', redisMiddleware, async (req, res) => {
  try {
    const audios = await prisma.audio.findMany({
      include: {
        album: true,
        artist: true,
      },
    });

    await redis.setex(req.originalUrl, 3600, JSON.stringify(audios));

    res.status(200).json(audios);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

router.get('/fulfill', async function (req, res) {
  try {
    processAudioFilesInDirectory(cloudinary);
  } catch (error) {
    throw new Error(error);
    console.log(error);
  }
});
//Search Audio
router.get('/search', async (req, res) => {
  try {
    const searchQuery = req.query.q || '';

    const searchResults = await prisma.audio.findMany({
      where: {
        title: {
          contains: searchQuery,
          mode: 'insensitive', // This will make the search case-insensitive
        },
      },
      include: {
        artist: true,
        album: true,
      },
    });

    res.status(200).json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Read Audio
router.get('/:id', async (req, res) => {
  try {
    const audioId = parseInt(req.params.id);

    // Try to get the audio from cache
    const cachedAudio = await redis.get(`/audio/${audioId}`);

    if (cachedAudio) {
      res.status(200).json(JSON.parse(cachedAudio));
    } else {
      // If not in cache, fetch from the database
      const audio = await prisma.audio.findUnique({
        where: {id: audioId},
        include: {
          album: true,
          artist: true,
        },
      });

      if (audio) {
        // Cache the audio for 1 hour
        await redis.setex(`/audio/${audioId}`, 3600, JSON.stringify(audio));
        res.status(200).json(audio);
      } else {
        res.status(404).json({message: 'Audio not found'});
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Update Audio
router.put('/:id', async (req, res) => {
  const audioId = parseInt(req.params.id);

  try {
    const updatedAudio = await prisma.audio.update({
      where: {id: audioId},
      data: req.body,
      include: {
        album: true,
        artist: true,
      },
    });

    // Delete cache for the updated audio
    await redis.del(`/audio/${audioId}`);

    res.status(200).json(updatedAudio);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Delete Audio
router.delete('/:id', async (req, res) => {
  const audioId = parseInt(req.params.id);

  try {
    // Récupérer l'id de l'album avant de supprimer l'audio
    const {albumId} = await prisma.audio.findUnique({
      where: {id: audioId},
      select: {albumId: true},
    });

    // Supprimer l'audio de la base de données
    const deletedAudio = await prisma.audio.delete({
      where: {id: audioId},
    });

    // Supprimer le cache pour l'audio supprimé
    await redis.del(`/audio/${audioId}`);

    // Récupérer l'objet complet de l'album
    const album = await prisma.album.findUnique({
      where: {id: albumId},
      include: {
        artist: true,
        audios: true,
      }, // Ajustez ceci en fonction de votre modèle de données
    });

    // Retourner l'objet complet de l'album dans la réponse
    res.status(200).json({album});
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// uploadHandler.js
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const audioFile = req.file;
    const albumId = req.body.albumId ? parseInt(req.body.albumId) : null;
    let thumbnail = null;

    // if (
    //   audioFile.mimetype === 'audio/mpeg' ||
    //   audioFile.mimetype === 'video/mp4'
    // ) {
    const metaData = await getMetadata(audioFile.path);
    // const metadataPromise = getWavMetadata(file);
    // metaData = await metadataPromise;
    // } else {
    //   const metadataPromise = getWavMetadata(audioFile.path);
    //   metaData = await metadataPromise;
    // }

    // Upload the audio file to Cloudinary
    const audioCloudinaryUpload = await cloudinary.uploader.upload(
      audioFile.path,
      {
        resource_type: 'auto',
        folder: 'audio',
      },
    );

    // Check if the artist already exists
    const existingArtist = await prisma.artist.findFirst({
      where: {name: metaData.common.artist},
    });

    // If the artist doesn't exist, create a new one
    const newArtist =
      existingArtist ||
      (await prisma.artist.create({
        data: {
          name: metaData.common.artist,
        },
      }));

    // Check if the album already exists for the artist
    let where = {
      artistId: newArtist.id,
      title: albumId ? undefined : metaData.common.album,
      id: albumId || undefined,
    };

    const existingAlbum = await prisma.album.findFirst({
      where: where,
    });

    let newAlbum = existingAlbum;

    if (!existingAlbum) {
      // If the album doesn't exist, create a new one
      newAlbum = await prisma.album.create({
        data: {
          title: metaData.common.album,
          artistId: newArtist.id,
          thumbnail: null, // Initialize thumbnail to null
        },
      });

      // Upload the image of the album and update the thumbnail field
      const imageUploadPromise = new Promise((resolve, reject) => {
        const imageCloudinaryUpload = cloudinary.uploader.upload_stream(
          {folder: 'image'},
          function (error, result) {
            if (error) {
              console.log(error);
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          },
        );
        streamifier
          .createReadStream(metaData.common.picture[0].data)
          .pipe(imageCloudinaryUpload);
      });

      // Wait for the image upload to complete before continuing
      thumbnail = await imageUploadPromise;

      // Update the thumbnail field in the newly created album
      await prisma.album.update({
        where: {id: newAlbum.id},
        data: {thumbnail: thumbnail},
      });
    } else {
      // If the album exists, use its existing thumbnail
      thumbnail = existingAlbum.thumbnail;
    }

    console.log(albumId, newAlbum);
    console.log('durationnnn', metaData);
    // Create the audio using Prisma
    const newAudio = await prisma.audio.create({
      data: {
        title: metaData.common.title,
        url: audioCloudinaryUpload.url,
        artistId: newArtist.id,
        albumId: albumId ?? newAlbum?.id,
        duration: metaData.format.duration,
      },
    });
    res.status(200).json({
      audio: newAudio,
      artist: newArtist,
      album: newAlbum,
      thumbnail: thumbnail,
      message: 'Fichier audio téléchargé avec succès',
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({error: 'Erreur lors du téléchargement du fichier audio'});
  }
});

export default router;
