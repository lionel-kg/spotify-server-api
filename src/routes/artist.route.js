import express from 'express';
const router = express.Router();
import {prisma} from '../config/db';
import redisMiddleware from '../middleware/redis';

// Create Artist
router.post('/', async (req, res) => {
  try {
    const artist = await prisma.artist.create({data: req.body});
    res.status(201).json(artist);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
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
    res.status(500).json({message: 'Internal server error'});
  }
});

// Read Artist
router.get('/:id', async (req, res) => {
  try {
    const artistId = parseInt(req.params.id);

    // Try to get the artist from cache
    const cachedArtist = await redis.get(`/artists/${artistId}`);

    if (cachedArtist) {
      res.status(200).json(JSON.parse(cachedArtist));
    } else {
      // If not in cache, fetch from the database
      const artist = await prisma.artist.findUnique({
        where: {id: artistId},
        include: {
          albums: true,
          audios: true,
        },
      });

      if (artist) {
        // Cache the artist for 1 hour
        await redis.setex(`/artists/${artistId}`, 3600, JSON.stringify(artist));
        res.status(200).json(artist);
      } else {
        res.status(404).json({message: 'Artist not found'});
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Update Artist
router.put('/:id', async (req, res) => {
  const artistId = parseInt(req.params.id);

  try {
    const updatedArtist = await prisma.artist.update({
      where: {id: artistId},
      data: req.body,
      include: {
        albums: true,
        audios: true,
      },
    });

    // Delete cache for the updated artist
    await redis.del(`/artists/${artistId}`);

    res.status(200).json(updatedArtist);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Delete Artist
router.delete('/:id', async (req, res) => {
  const artistId = parseInt(req.params.id);

  try {
    // Delete artist from the database
    const deletedArtist = await prisma.artist.delete({
      where: {id: artistId},
    });

    // Delete cache for the deleted artist
    await redis.del(`/artists/${artistId}`);

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

export default router;
