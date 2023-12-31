import express from 'express';
const router = express.Router();
import audioRouter from './audio.route';
import albumRouter from './album.route';
import artistRouter from './artist.route';
import statRouter from './stat.route';

router.use('/audio', audioRouter);
router.use('/album', albumRouter);
router.use('/artist', artistRouter);
router.use('/stat', statRouter);

export default router;
