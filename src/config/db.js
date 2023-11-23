// config/db.js
import {Sequelize} from 'sequelize';
import Artist from '../model/artist.model';
import Album from '../model/album.model';
import Audio from '../model/audio.model';

const environment = process.env;
const sequelize = new Sequelize('spotify_db', 'jeremy_test', 'Test1234', {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
  sync: {force: false},
});

// Artist?.hasMany(Audio);
// Audio?.belongsTo(Artist);

// Album?.hasMany(Audio);
// Audio?.belongsTo(Album);

export default sequelize;
