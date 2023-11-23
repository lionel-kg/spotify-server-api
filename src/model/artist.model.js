// models/Artist.js
const {DataTypes} = require('sequelize');
import {sequelize} from '../config/db';

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

export default Artist;
