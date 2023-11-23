const express = require('express');
const app = express();
const port = 4001 || process.env.PORT;
const cors = require('cors');
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
