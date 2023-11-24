import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import Router from './src/routes';
import redis from './src/config/redis';

const app = express();
const port = process.env.PORT || 4001;

app.use(bodyParser.json());
app.use(cors());
app.use('/', Router);

app.listen(port, () => {
  console.log(`Le serveur écoute sur le port ${port}`);
});

const exempleUtilisationRedis = async () => {
  try {
    // Exemple : Stocker une valeur dans Redis
    redis.definirAvecTTLParDefaut('myKey', 'myValue');

    // Get the TTL for that key

    // Exemple : Récupérer une valeur depuis Redis
    const valeur = await redis.client.get('myKey');
    console.log('Valeur récupérée depuis Redis:', valeur);
  } catch (error) {
    console.error('Erreur Redis:', error);
  } finally {
    // Assure-toi de libérer les ressources après avoir terminé
    // await redis.quit();
  }
};

// Appelle la fonction pour effectuer des opérations Redis
exempleUtilisationRedis();
