const express = require('express');
const router = express.Router();
const Album = require('../../models/album.model');

// Create Album
router.post('/', async (req, res) => {
  try {
    const album = await Album.create(req.body);
    res.status(201).json(album);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Read Albums
router.get('/', async (req, res) => {
  try {
    const albums = await Album.findAll();
    res.status(200).json(albums);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Update Album
router.put('/:id', async (req, res) => {
  try {
    const album = await Album.findByPk(req.params.id);
    if (album) {
      await album.update(req.body);
      res.status(200).json(album);
    } else {
      res.status(404).json({message: 'Album not found'});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Delete Album
router.delete('/:id', async (req, res) => {
  try {
    const album = await Album.findByPk(req.params.id);
    if (album) {
      await album.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({message: 'Album not found'});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

module.exports = router;
