import express from 'express';
const router = express.Router();
import {prisma} from '../config/db';
import redisMiddleware from '../middleware/redis';

// Create Album
router.post('/', async (req, res) => {
  try {
    const album = await prisma.album.create({data: req.body});
    res.status(201).json(album);
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
    const cachedAlbum = await redis.get(`/albums/${albumId}`);

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
        await redis.setex(`/albums/${albumId}`, 3600, JSON.stringify(album));
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
      data: req.body,
      include: {
        artist: true,
        audios: true,
      },
    });

    // Delete cache for the updated album
    await redis.del(`/albums/${albumId}`);

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
    // Delete album from the database
    const deletedAlbum = await prisma.album.delete({
      where: {id: albumId},
    });

    // Delete cache for the deleted album
    await redis.del(`/albums/${albumId}`);

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

export default router;
