import express from 'express';
const router = express.Router();
import {prisma} from '../config/db';

import Redis from 'ioredis';
import redisMiddleware from '../middleware/redis';
const redis = new Redis({enableAutoPipelining: true});

router.get('/', async (req, res) => {
  try {
    const numberOfSongs = await prisma.audio.count();
    const numberOfAlbums = await prisma.album.count();
    // Ajoutez ici la logique pour obtenir le nombre d'écoutes

    // Vous pouvez également ajouter d'autres statistiques selon vos besoins

    res.status(200).json({
      numberOfSongs: {label: 'nombre de morceaux', count: numberOfSongs},
      numberOfAlbums: {label: "nombre d'albums", count: numberOfAlbums},
      // Ajoutez ici le nombre d'écoutes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

export default router;
