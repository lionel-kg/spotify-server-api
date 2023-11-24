const express = require('express');
const app = express();
const port = 4001 || process.env.PORT;
const cors = require('cors');

import redis from './src/config/redis';
import sequelize from './src/config/db';
// const bodyParser = require('body-parser');
console.log(process.env.PORT);
app.use(cors());
// app.use(bodyParser.urlencoded({extended: true}));
app.use('/', require('./src/routes/audio.route'));
// app.use(bodyParser.json());
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
