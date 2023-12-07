import express from 'express';
const router = express.Router();
import {prisma} from '../config/db';

import Redis from 'ioredis';
import redisMiddleware from '../middleware/redis';
const redis = new Redis({enableAutoPipelining: true});

// Create Album
router.post('/', async (req, res) => {
  try {
    const {title} = req.body;

    const existingAlbum = await prisma.album.findFirst({
      where: {
        title: title,
      },
    });

    if (existingAlbum) {
      res.status(200).json(existingAlbum);
    } else {
      const newAlbum = await prisma.album.create({
        data: req.body,
      });

      await redis.del(`/album`);
      await redis.del(`/artist/${req.body.artistId}`);

      res.status(201).json(newAlbum);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
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
    res.status(500).json({message: 'Internal server error'});
  }
});

// Read Album
router.get('/:id', async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);

    // Try to get the album from cache
    const cachedAlbum = await redis.get(`/album/${albumId}`);

    if (cachedAlbum) {
      res.status(200).json(JSON.parse(cachedAlbum));
    } else {
      // If not in cache, fetch from the database
      const album = await prisma.album.findUnique({
        where: {id: albumId},
        include: {
          artist: true,
          audios: true,
        },
      });

      if (album) {
        // Cache the album for 1 hour
        await redis.setex(`/album/${albumId}`, 3600, JSON.stringify(album));
        res.status(200).json(album);
      } else {
        res.status(404).json({message: 'Album not found'});
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Update Album
router.put('/:id', async (req, res) => {
  const albumId = parseInt(req.params.id);

  try {
    const updatedAlbum = await prisma.album.update({
      where: {id: albumId},
      data: {
        // Update album fields
        title: req.body.title, // Add other fields as needed

        // Update audios
        audios: {
          updateMany: req.body.audios.map(audio => ({
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
    res.status(500).json({message: 'Internal server error'});
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
        where: {albumId},
      });

      // Delete each audio file
      await Promise.all(
        audioFiles.map(async audio => {
          // Delete cache for the deleted audio file
          await redis.del(`/audio/${audio.id}`);

          // Delete audio file from the database
          await prisma.audio.delete({where: {id: audio.id}});
        }),
      );

      // Delete album from the database
      const deletedAlbum = await prisma.album.delete({
        where: {id: albumId},
      });

      // Delete cache for the deleted album
      await redis.del(`/album/${albumId}`);

      res.status(204).end();
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

export default router;
