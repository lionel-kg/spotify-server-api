import {createClient} from 'redis';

// Configuration Redis
const redisConfig = {
  host: '127.0.0.1', // Remplace avec l'adresse IP ou le nom d'hôte de ton serveur Redis
  port: 6379, // Port par défaut de Redis
  // Ajoute d'autres options si nécessaire
};

// Création du client Redis
const client = createClient(redisConfig);

// Gestion des erreurs
client.on('error', err => console.log('Redis Client Error', err));

client.connect();

// Vérification de la connexion
client.on('ready', () => {
  console.log('Client Redis connecté');
});

export default client;
