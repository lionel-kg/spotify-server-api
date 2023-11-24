// config/db.js
import {Sequelize} from 'sequelize';
import Artist from '../../models/artist.model';
import Album from '../../models/album.model';
import Audio from '../../models/audio.model';

const environment = process.env;
const sequelize = new Sequelize('spotify_db', 'jeremy_test', 'Test1234', {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
  logging: console.log,
  sync: {force: false},
});

Artist?.hasMany(Audio);
Audio?.belongsTo(Artist);

Album?.hasMany(Audio);
Audio?.belongsTo(Album);

export default sequelize;
