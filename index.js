const express = require('express');
const app = express();
const port = 3000;

// Définir une route simple
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Le serveur écoute sur le port ${port}`);
});
