import express from 'express';
const router = express.Router();
import {prisma} from '../config/db';
import {upload} from '../services/upload.service';
import {getWavMetadata, convertMp4ToWav} from '../services/audio.service';
import cloudinary from '../config/cloudinary';

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
    // Delete audio from the database
    const deletedAudio = await prisma.audio.delete({
      where: {id: audioId},
    });

    // Delete cache for the deleted audio
    await redis.del(`/audio/${audioId}`);

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// uploadHandler.js
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const audioFile = req.file;
    let metaData = null;
    let imageCloudinaryUpload = null;

    if (
      audioFile.mimetype === 'audio/mpeg' ||
      audioFile.mimetype === 'video/mp4'
    ) {
      const file = await convertMp4ToWav(audioFile.path);
      const metadataPromise = getWavMetadata(file);
      metaData = await metadataPromise;
    } else {
      const metadataPromise = getWavMetadata(audioFile.path);
      metaData = await metadataPromise;
    }

    // Upload the audio file to Cloudinary
    const audioCloudinaryUpload = await cloudinary.uploader.upload(
      audioFile.path,
      {
        resource_type: 'auto',
        folder: 'audio', // Optional: Set the Cloudinary folder
      },
    );

    // Create artist, album, and audio using Prisma
    const newArtist = await prisma.artist.create({
      data: {
        name: metaData.common.artist,
      },
    });
    if (newArtist) {
      const newAlbum = await prisma.album.create({
        data: {
          title: metaData.common.album,
          artistId: newArtist.id,
        },
      });

      if (newAlbum) {
        const newAudio = await prisma.audio.create({
          data: {
            title: metaData.common.title,
            url: audioCloudinaryUpload.url,
            artistId: newArtist.id,
            albumId: newAlbum.id,
          },
        });

        if (newAudio) {
          res.status(200).json({
            audio: newAudio,
            artist: newArtist,
            album: newAlbum,
            // image: imageCloudinaryUpload, // Ajout du résultat de l'upload de l'image dans la réponse
            // metaData: metaData.common,
            message: 'Fichier audio téléchargé avec succès',
          });
        } else {
          res
            .status(500)
            .json({error: "Erreur lors de la création de l'audio"});
        }
      } else {
        res.status(500).json({error: "Erreur lors de la création de l'album"});
      }
    } else {
      res.status(500).json({error: "Erreur lors de la création de l'artiste"});
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({error: 'Erreur lors du téléchargement du fichier audio'});
  }
});

export default router;
