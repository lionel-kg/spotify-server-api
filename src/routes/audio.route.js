const express = require('express');
const router = express.Router();
const Audio = require('../../models/audio.model');

// Create Audio
router.post('/', async (req, res) => {
  try {
    const audio = await Audio.create(req.body);
    res.status(201).json(audio);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Read Audios
router.get('/', async (req, res) => {
  try {
    const audios = await Audio.findAll();
    res.status(200).json(audios);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Update Audio
router.put('/:id', async (req, res) => {
  try {
    const audio = await Audio.findByPk(req.params.id);
    if (audio) {
      await audio.update(req.body);
      res.status(200).json(audio);
    } else {
      res.status(404).json({message: 'Audio not found'});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Delete Audio
router.delete('/:id', async (req, res) => {
  try {
    const audio = await Audio.findByPk(req.params.id);
    if (audio) {
      await audio.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({message: 'Audio not found'});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

module.exports = router;
