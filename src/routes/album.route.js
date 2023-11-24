import express from 'express';
const router = express.Router();
import {prisma} from '../config/db';

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
router.get('/', async (req, res) => {
  try {
    const albums = await prisma.album.findMany({
      include: {
        artist: true,
        audios: true,
      },
    });
    res.status(200).json(albums);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Read Album
router.get('/:id', async (req, res) => {
  try {
    const album = await prisma.album.findUnique({
      where: {id: parseInt(req.params.id)},
      include: {
        artist: true,
        audios: true,
      },
    });
    res.status(200).json(album);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Update Album
router.put('/:id', async (req, res) => {
  try {
    const album = await prisma.album.update({
      where: {id: parseInt(req.params.id)},
      data: req.body,
      include: {
        artist: true,
        audios: true,
      },
    });
    res.status(200).json(album);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Delete Album
router.delete('/:id', async (req, res) => {
  try {
    const album = await prisma.album.delete({
      where: {id: parseInt(req.params.id)},
    });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

export default router;
