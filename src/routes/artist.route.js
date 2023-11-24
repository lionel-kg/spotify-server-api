const express = require('express');
const router = express.Router();
const {prisma} = require('../config/db');

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
router.get('/', async (req, res) => {
  try {
    const artists = await prisma.artist.findMany();
    res.status(200).json(artists);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Update Artist
router.put('/:id', async (req, res) => {
  try {
    const artist = await prisma.artist.update({
      where: {id: parseInt(req.params.id)},
      data: req.body,
    });
    res.status(200).json(artist);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Delete Artist
router.delete('/:id', async (req, res) => {
  try {
    const artist = await prisma.artist.delete({
      where: {id: parseInt(req.params.id)},
    });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

module.exports = router;
