// models/Artist.js
const {DataTypes} = require('sequelize');
import {sequelize} from '../src/config/db';
import Audio from './audio.model';

const Artist = sequelize?.define('Artist', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Artist.hasMany(Audio);

export default Artist;
