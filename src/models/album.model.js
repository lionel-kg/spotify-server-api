// models/Album.js
const {DataTypes} = require('sequelize');
import {sequelize} from '../src/config/db';

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

export default Album;
