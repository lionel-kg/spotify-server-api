# Utiliser une image de Node.js comme base
FROM node:latest

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de package.json et package-lock.json (s'ils existent)
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tous les fichiers du projet dans le conteneur
COPY . .

# Exposer le port sur lequel le serveur écoute
EXPOSE 3000

# Lancer la commande de démarrage de ton serveur
CMD ["npm", "start"]


