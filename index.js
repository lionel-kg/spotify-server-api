// server.js

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http'; // Utilisez le module http de Node.js
import {Server} from 'socket.io';
import Router from './src/routes';
import Redis from 'ioredis';

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use('/', Router);
const server = http.createServer(app); // Créez le serveur HTTP
const io = new Server(server, {
  cors: {
    origin: '*',
  },
}); // Créez l'instance Socket.IO associée au serveur HTTP
const port = process.env.PORT || 4001;

// Stocker les informations sur les salles et les utilisateurs
const rooms = new Map();

app.get('/rooms', (req, res) => {
  const roomList = Object.keys(rooms).map(roomId => ({
    roomId,
    userCount: rooms[roomId].users.length,
  }));

  res.json(roomList);
});

io.on('connection', socket => {
  console.log("Un client WebSocket s'est connecté");
  // Émettre l'état actuel du lecteur audio à chaque nouvel utilisateur
  socket.emit('playbackState', {
    currentTime: 0, // Vous pouvez récupérer cela de la base de données ou d'autres sources
    isPlaying: false, // false par défaut, ou l'état actuel du lecteur
    playlist: [''], // la playlist actuelle
  });

  // Exemple d'événement personnalisé à envoyer au client
  socket.emit('message', 'Bienvenue sur le serveur WebSocket !');

  socket.on('createRoom', data => {
    console.log('data1', data);
    // Vérifiez si la salle existe déjà
    if (!rooms[data.roomId]) {
      // Créez la salle avec le créateur (premier utilisateur)
      rooms[data.roomId] = {
        users: [{userId: data.userId, socketId: socket.id}],
        creator: data.userId,
      };

      // Joignez la salle
      socket.join(data.roomId);

      // Informez le créateur que la salle a été créée
      socket.emit('roomCreated', {
        roomId: data.roomId,
        users: rooms[data.roomId].users,
      });
    } else {
      // La salle existe déjà, émettez un événement d'erreur ou prenez une autre action
      // Vous pouvez également informer le client que la salle existe déjà
      socket.emit('roomExists', {error: 'La salle existe déjà'});
    }
  });

  // Événement lorsqu'un utilisateur rejoint une salle
  socket.on('joinRoom', data => {
    // Rejoindre la salle
    data.roomId = parseInt(data.roomId);

    // Vérifiez si la salle existe dans la Map
    if (!rooms.has(data.roomId)) {
      rooms.set(data.roomId, {users: []});
    }

    // Stocker les informations sur l'utilisateur
    const userInfo = {socketId: socket.id, userId: data.userId};
    rooms.get(data.roomId).users.push(userInfo);

    console.log('Room', rooms.get(data.roomId).users.length);

    // Informer tous les clients de la salle qu'un utilisateur a rejoint
    io.to(data.roomId).emit('userJoined', {
      roomId: data.roomId,
      userId: data.userId,
      userCount: rooms.get(data.roomId).users.length,
    });
  });

  // Événement lorsqu'un utilisateur commence à jouer une piste audio
  socket.on('startPlayback', data => {
    console.log(data);
    // Informer tous les clients de la salle que la lecture a commencé
    io.emit('playbackStarted', data);
  });

  socket.on('disconnect', () => {
    console.log("Un client WebSocket s'est déconnecté");

    // Gérer la déconnexion de l'utilisateur et informer les autres membres de la salle
    rooms.forEach((userList, roomId) => {
      console.log(userList);
      console.log(roomId);
      const index = userList.users.findIndex(
        user => user.socketId === socket.id,
      );
      if (index !== -1) {
        const disconnectedUser = userList.users.splice(index, 1)[0];
        io.to(roomId).emit('userLeft', {
          roomId: roomId,
          userCount: rooms[roomId].users?.length,
        });

        // Supprimer la salle si elle est vide
        if (userList.length === 0) {
          delete rooms[roomId];

          // Envoyer la nouvelle liste des salles à tous les clients
          const updatedRoomList = Object.keys(rooms).map(roomId => ({
            roomId,
            userCount: rooms[roomId].users.length,
          }));
          io.emit('roomsList', updatedRoomList);
        }
      }
    });
  });

  socket.on('getRooms', () => {
    const roomList = Object.keys(rooms).map(roomId => ({
      roomId,
      userCount: rooms[roomId].users.length,
    }));

    // Envoyer la liste des salles au client
    socket.emit('roomsList', roomList);
  });

  socket.on('isCurrentlyPlaying', isPlaying => {
    console.log(isPlaying);
    io.emit('isPlaying', isPlaying);
  });

  socket.on('sendCurrentTime', currentTime => {
    io.emit('syncAudio', currentTime);
  });
});

server.listen(port, () => {
  console.log(`Le serveur écoute sur le port ${port}`);
});

const redis = new Redis({enableAutoPipelining: true});

const performRedisQuery = async () => {
  try {
    await redis.set('test', 'test', 'EX', 30);
    const value = await redis.get('test');
    console.log('Valeur de Redis:', value);
  } catch (error) {
    console.error('Erreur Redis:', error);
  }
};

// Appelle la fonction pour effectuer des opérations Redis
performRedisQuery();
