const express = require('express');
const router = express.Router();
const audioRouter = require('./audio.route');
const albumRouter = require('./album.route');
const artistRouter = require('./artist.route');

router.use('/audio', audioRouter);
router.use('/album', albumRouter);
router.use('/artist', artistRouter);

module.exports = router;
