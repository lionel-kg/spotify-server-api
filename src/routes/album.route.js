import express from 'express';
const router = express.Router();
import { prisma } from '../config/db';

import Redis from 'ioredis';
import redisMiddleware from '../middleware/redis';
const redis = new Redis({ enableAutoPipelining: true });

// Create Album
router.post('/', async (req, res) => {
  try {
    const { title, artistId, thumbnail, audio } = req.body;
    const existingAlbum = await prisma.album.findFirst({
      where: {
        title: title,
      },
    });

    if (existingAlbum) {
      res.status(200).json(existingAlbum);
    } else {
      const newAlbum = await prisma.album.create({
        data: {
          title,
          artistId,
          thumbnail,
        },
      });

      if (audio !== undefined) {
        for (const element of audio) {
          await prisma.audio.update({
            where: { id: element.id },
            data: {
              albumId: newAlbum.id,
            },
          });
        }
      }

      await redis.del(`/album`);
      await redis.del(`/artist/${req.body.artistId}`);

      res.status(201).json(newAlbum);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Read Albums
router.get('/', redisMiddleware, async (req, res) => {
  try {
    const albums = await prisma.album.findMany({
      include: {
        artist: true,
        audios: true,
      },
    });

    await redis.setex(req.originalUrl, 3600, JSON.stringify(albums));

    res.status(200).json(albums);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search Albums
router.get('/search', async (req, res) => {
  try {

    const searchQuery = req.query.q || '';


    const searchResults = await prisma.album.findMany({
      where: {
        title: {
          contains: searchQuery,
          mode: 'insensitive', // This will make the search case-insensitive
        },
      },
      include: {
        artist: true,
        audios: true,
      },
    });

    res.status(200).json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Read Album
router.get('/:id', async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);

    // Try to get the album from cache
    // const cachedAlbum = await redis.get(`/album/${albumId}`);

    // if (cachedAlbum) {
    //   res.status(200).json(JSON.parse(cachedAlbum));
    // } else {
    // If not in cache, fetch from the database
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        artist: true,
        audios: true,
      },
    });

    if (album) {
      // Cache the album for 1 hour
      // await redis.setex(`/album/${albumId}`, 3600, JSON.stringify(album));
      res.status(200).json(album);
    } else {
      res.status(404).json({ message: 'Album not found' });
    }
    // }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update Album
router.put('/:id', async (req, res) => {
  const albumId = parseInt(req.params.id);

  try {
    const updatedAlbum = await prisma.album.update({
      where: { id: albumId },
      data: {
        // Update album fields
        title: req.body.title, // Add other fields as needed
        thumbnail: req.body.thumbnail,
        // Update audios
        audios: {
          updateMany: req.body.audios?.map(audio => ({
            data: {
              title: audio.title, // Add other audio fields as needed
              // ... (other audio fields)
            },
            where: {
              id: audio.id, // Specify the unique identifier for each audio
            },
          })),
        },
      },
      include: {
        artist: true,
        audios: true,
      },
    });

    // Delete cache for the updated album
    await redis.del(`/album/${albumId}`);

    res.status(200).json(updatedAlbum);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Album
router.delete('/:id', async (req, res) => {
  const albumId = parseInt(req.params.id);

  try {
    // Use a Prisma transaction to ensure atomicity
    await prisma.$transaction(async prisma => {
      // Get all audio files associated with the album
      const audioFiles = await prisma.audio.findMany({
        where: { albumId },
      });

      // Use Promise.allSettled to continue even if some deletions fail
      await Promise.allSettled(
        audioFiles.map(async audio => {
          // Delete cache for the deleted audio file
          await redis.del(`/audio/${audio.id}`);

          // Delete audio file from the database
          return prisma.audio.delete({ where: { id: audio.id } });
        }),
      );

      // Delete album from the database
      const deletedAlbum = await prisma.album.delete({
        where: { id: albumId },
      });

      // Delete cache for the deleted album
      await redis.del(`/album/${albumId}`);

      res.status(204).end();
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/pagination', redisMiddleware, async (req, res) => {
  try {
    // Paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Nombre d'albums par page

    // Calcul de l'offset pour la requête
    const offset = (page - 1) * limit;

    // Requête pour récupérer les albums paginés
    const albums = await prisma.album.findMany({
      include: {
        artist: true,
        audios: true,
      },
      skip: offset,
      take: limit,
    });

    // Requête pour récupérer le nombre total d'albums sans la pagination
    const nbResults = await prisma.album.count();

    // Enregistrez les données dans le cache Redis avec une clé unique basée sur les paramètres de pagination
    // const cacheKey = `${req.originalUrl}_page_${page}_limit_${limit}`;
    // await redis.setex(cacheKey, 3600, JSON.stringify(albums));

    res.status(200).json({ albums, nbResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



export default router;
