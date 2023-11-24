const express = require('express');
const app = express();
const port = 4001 || process.env.PORT;
const cors = require('cors');
const bodyParser = require('body-parser');
const Router = require('./src/routes');

import redis from './config/redis';
import sequelize from './config/db';

app.use(bodyParser.json());
app.use(cors());
app.use('/', Router);

sequelize
  ?.sync()
  .then(() => {
    console.log('Base de données synchronisée');
    app.listen(port, () => {
      console.log(`Le serveur écoute sur le port ${port}`);
    });
  })
  .catch(error => {
    console.error('Erreur de synchronisation de la base de données :', error);
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
