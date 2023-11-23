// models/Album.js
const {DataTypes} = require('sequelize');
import {sequelize} from '../src/config/db';
import Artist from './artist.model';
import Audio from './audio.model';

const Album = sequelize?.define('Album', {
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
  // Ajoutez d'autres champs album selon vos besoins
});

Album.belongsTo(Artist);
Album.hasMany(Audio);

export default Album;
