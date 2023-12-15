import express from 'express';
const router = express.Router();

import { prisma } from '../config/db';

import Redis from 'ioredis';
import redisMiddleware from '../middleware/redis';
const redis = new Redis({ enableAutoPipelining: true });

// Create Artist
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const existingArtist = await prisma.artist.findFirst({
      where: {
        name: name,
      },
    });
    console.log(existingArtist);
    if (existingArtist) {
      res.status(200).json(existingArtist);
    } else {
      const newArtist = await prisma.artist.create({
        data: req.body,
      });

      await redis.del(`/artist`);

      res.status(201).json(newArtist);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Read Artists
router.get('/', redisMiddleware, async (req, res) => {
  try {
    const artists = await prisma.artist.findMany({
      include: {
        albums: true,
        audios: true,
      },
    });
    await redis.setex(req.originalUrl, 3600, JSON.stringify(artists));

    res.status(200).json(artists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Search Artist
router.get('/search', async (req, res) => {
  try {

    const searchQuery = req.query.q || '';

    const searchResults = await prisma.artist.findMany({
      where: {
        name: {
          contains: searchQuery,
          mode: 'insensitive', // This will make the search case-insensitive
        },
      },
      include: {
        albums: true,
        audios: true,
      },
    });

    res.status(200).json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Read Artist
router.get('/:id', async (req, res) => {
  try {
    const artistId = parseInt(req.params.id);

    // Try to get the artist from cache
    const cachedArtist = await redis.get(`/artist/${artistId}`);

    if (cachedArtist) {
      res.status(200).json(JSON.parse(cachedArtist));
    } else {
      // If not in cache, fetch from the database
      const artist = await prisma.artist.findUnique({
        where: { id: artistId },
        include: {
          albums: true,
          audios: true,
        },
      });

      if (artist) {
        // Cache the artist for 1 hour
        await redis.setex(`/artist/${artistId}`, 3600, JSON.stringify(artist));
        res.status(200).json(artist);
      } else {
        res.status(404).json({ message: 'Artist not found' });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update Artist
router.put('/:id', async (req, res) => {
  const artistId = parseInt(req.params.id);
  try {
    const updatedArtist = await prisma.artist.update({
      where: { id: artistId },
      data: req.body,
      include: {
        albums: true,
        audios: true,
      },
    });
    const artists = await prisma.artist.findMany({
      include: {
        albums: true,
        audios: true,
      },
    });
    // Delete cache for the updated artist
    await redis.del(`/artists/${artistId}`);
    res.status(200).json(artists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Artist
router.delete('/:id', async (req, res) => {
  const artistId = parseInt(req.params.id);
  try {
    // Use a Prisma transaction to ensure atomicity
    await prisma.$transaction(async prisma => {
      // Delete artist's albums
      const deletedAlbums = await prisma.album.deleteMany({
        where: { artistId },
      });
      // Delete artist's audio files
      const deletedAudioFiles = await prisma.audio.deleteMany({
        where: { artistId },
      });
      // Delete the artist
      const deletedArtist = await prisma.artist.delete({
        where: { id: artistId },
      });
      const artists = await prisma.artist.findMany({
        include: {
          albums: true,
          audios: true,
        },
      });
      // Delete cache for the deleted artist
      await redis.del(`/artists/${artistId}`);
      res.status(200).json(artists);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
