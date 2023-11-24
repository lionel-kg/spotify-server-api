const express = require('express');
const router = express.Router();
const {prisma} = require('../config/db');

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
router.get('/', async (req, res) => {
  try {
    const audios = await prisma.audio.findMany();
    res.status(200).json(audios);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Update Audio
router.put('/:id', async (req, res) => {
  try {
    const audio = await prisma.audio.update({
      where: {id: parseInt(req.params.id)},
      data: req.body,
    });
    res.status(200).json(audio);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Delete Audio
router.delete('/:id', async (req, res) => {
  try {
    const audio = await prisma.audio.delete({
      where: {id: parseInt(req.params.id)},
    });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

module.exports = router;
