import {createClient} from 'redis';

// Configuration Redis
const redisConfig = {
  host: '127.0.0.1', // Remplace avec l'adresse IP ou le nom d'hôte de ton serveur Redis
  port: 6379, // Port par défaut de Redis
};

// Création du client Redis
const client = createClient(redisConfig);
// Gestion des erreurs
client.on('error', err => console.log('Redis Client Error', err));

client.connect();

// Fonction pour ajouter du TTL sur les clés
const definirAvecTTLParDefaut = async (key, value, defaultTtl = 60) => {
  // Définir la clé avec le TTL par défaut
  await client.set(key, value, {EX: defaultTtl});
};
// Vérification de la connexion
client.on('ready', () => {
  console.log('Client Redis connected');
});

export default {client, definirAvecTTLParDefaut};
