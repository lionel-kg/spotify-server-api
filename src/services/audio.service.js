import ffmpeg from 'fluent-ffmpeg';
import {path as ffmpegPath} from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import mm from 'music-metadata';

// const exiftool = require('node-exiftool');
// const exiftoolPath = 'C:/Users/lione/Documents/exiftool/exiftool';
// const ep = new exiftool.ExiftoolProcess(exiftoolPath);

export async function getMp4Metadata(filePath) {
  try {
    const metadata = await mm.parseFile(filePath, {duration: true});
    console.log('Métadonnées complètes:', metadata);
    // Afficher les balises ID3v2.4
    if (metadata.native && metadata.native['ID3v2.4']) {
      console.log('Balises ID3v2.4:', metadata.native['ID3v2.4']);
    }
  } catch (error) {
    console.error('Erreur lors de la lecture des métadonnées :', error.message);
  }
}

export async function getWavMetadata(filePath) {
  try {
    const metadata = await mm.parseFile(filePath);
    // console.log('Métadonnées complètes:', metadata);
    // console.log('Métadonnées complètes:', metadata.common);
    // Exemple d'accès à certaines métadonnées spécifiques
    // if (metadata.common) {
    //   console.log('Artiste:', metadata.common.artist);
    //   console.log('Album:', metadata.common.album);
    //   console.log('Titre:', metadata.common.title);
    //   console.log('Durée:', metadata.format.duration);
    //   // ... autres métadonnées spécifiques
    // }
    return Promise.resolve(metadata);
  } catch (error) {
    console.error('Erreur lors de la lecture des métadonnées :', error.message);
  }
}

export async function convertMp4ToWav(fileName) {
  // Vérifier si le fichier d'entrée existe
  if (!fs.existsSync(fileName)) {
    console.error("Le fichier n'existe pas.");
    return;
  }
  // Répertoire de sortie pour les fichiers M4a
  const outputFolder = path.join(__dirname, '../../public/wav');

  // Assurez-vous que le répertoire de sortie existe, sinon, créez-le
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, {recursive: true});
  }
  // Vérifier si le fichier M4a existe déjà
  const m4aFileName = path.basename(fileName, path.extname(fileName)) + '.wav';
  const outputPath = path.join(outputFolder, m4aFileName);
  const newPath = path.join(__dirname, '../../' + fileName);
  // Utiliser fluent-ffmpeg pour effectuer la conversion
  ffmpeg(newPath)
    .audioCodec('pcm_s16le')
    .audioChannels(1)
    .audioFrequency(16000)
    .format('wav')
    .on('end', () => {
      console.log('Conversion terminée avec succès.');
    })
    .on('error', err => {
      console.error('Erreur lors de la conversion :', err);
    })
    .save(outputPath);
  return Promise.resolve(outputPath);
}

// Spécifiez le chemin du répertoire d'entrée (MP4)
// const audioFolder = './audios/mp4';

// const audio = './audios/mp4/Snoop Dogg - Gin And Juice.mp3';
// const audio = 'audios/wav/m4a/9-01 Amsterdam.m4a';

// getMp4Metadata(audio);

// getWavMetadata(audio);

// Appel de la fonction de conversion
// convertMp4ToWav(audioFolder);
