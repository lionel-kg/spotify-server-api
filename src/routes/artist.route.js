const express = require('express');
const router = express.Router();
// const Artist = require('../../models/artist.model');
const {Artist} = require('../../models');
// Create Artist
router.post('/', async (req, res) => {
  try {
    const artist = await Artist.create(req.body);
    res.status(201).json(artist);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Read Artists
router.get('/', async (req, res) => {
  try {
    const artists = await Artist.findAll();
    res.status(200).json(artists);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Update Artist
router.put('/:id', async (req, res) => {
  try {
    const artist = await Artist.findByPk(req.params.id);
    if (artist) {
      await artist.update(req.body);
      res.status(200).json(artist);
    } else {
      res.status(404).json({message: 'Artist not found'});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Delete Artist
router.delete('/:id', async (req, res) => {
  try {
    const artist = await Artist.findByPk(req.params.id);
    if (artist) {
      await artist.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({message: 'Artist not found'});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

module.exports = router;
