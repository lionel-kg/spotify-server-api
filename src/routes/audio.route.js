import express from 'express';
const router = express.Router();
import {prisma} from '../config/db';
import redisMiddleware from '../middleware/redis';

// Create Audio
router.post('/', async (req, res) => {
  try {
    const audio = await prisma.audio.create({data: req.body});
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
    const cachedAudio = await redis.get(`/audios/${audioId}`);

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
        await redis.setex(`/audios/${audioId}`, 3600, JSON.stringify(audio));
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
    await redis.del(`/audios/${audioId}`);

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
    await redis.del(`/audios/${audioId}`);

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

export default router;
