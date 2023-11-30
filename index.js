import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import Router from './src/routes';
import Redis from 'ioredis';

const app = express();
const port = process.env.PORT || 4001;

app.use(bodyParser.json());
app.use(cors());
app.use('/', Router);

app.listen(port, () => {
  console.log(`Le serveur écoute sur le port ${port}`);
});

const redis = new Redis({enableAutoPipelining: true});

const performRedisQuery = async () => {
  try {
    // Effectuez votre requête Redis ici
    await redis.set('test', 'test', 'EX', 30);

    const value = await redis.get('test');

    console.log('Valeur de Redis:', value);
  } catch (error) {
    console.error('Erreur Redis:', error);
  }
};

// // Appelle la fonction pour effectuer des opérations Redis
performRedisQuery();
