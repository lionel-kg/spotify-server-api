// models/Audio.js
const {DataTypes} = require('sequelize');
import {sequelize} from '../src/config/db';
import Album from './album.model';

const Audio = sequelize?.define('Audio', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Ajoutez d'autres champs audio selon vos besoins
});

Audio.belongsTo(Album);

export default Audio;
