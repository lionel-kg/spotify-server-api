const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');
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
    console.log('Métadonnées complètes:', metadata.common);
    // Exemple d'accès à certaines métadonnées spécifiques
    if (metadata.common) {
      console.log('Artiste:', metadata.common.artist);
      console.log('Album:', metadata.common.album);
      console.log('Titre:', metadata.common.title);
      console.log('Durée:', metadata.format.duration);
      // ... autres métadonnées spécifiques
    }
  } catch (error) {
    console.error('Erreur lors de la lecture des métadonnées :', error.message);
  }
}

export function convertMp4ToWav(songFolder) {
  // Vérifier si le répertoire d'entrée existe
  if (!fs.existsSync(songFolder)) {
    console.error("Le répertoire n'existe pas.");
    return;
  }

  // Répertoire de sortie pour les fichiers WAV
  const outputFolder = './songs/wav';

  // Assurez-vous que le répertoire de sortie existe, sinon, créez-le
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }

  fs.readdirSync(songFolder, {withFileTypes: true}).forEach(file => {
    const fileName = file.name;

    // Vérifier si le fichier WAV existe déjà
    const wavFileName = fileName.replace('.mp4', '.wav');
    const outputPath = path.join(outputFolder, wavFileName);

    if (fs.existsSync(outputPath)) {
      console.log(
        `Le fichier WAV existe déjà pour ${fileName}. La conversion est ignorée.`,
      );
      return;
    }
    getMp4Metadata(path.join(songFolder, fileName));
    ffmpeg.setFfmpegPath(ffmpegPath);
    // Utiliser fluent-ffmpeg pour effectuer la conversion
    ffmpeg(path.join(songFolder, fileName))
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
  });
}

// Spécifiez le chemin du répertoire d'entrée (MP4)
// const songFolder = './songs/mp4';

// const song = './songs/mp4/Snoop Dogg - Gin And Juice.mp3';
// const song = './songs/wav/Superhero (Heroes & Villains).wav';

// getMp4Metadata(song);

// getWavMetadata(song);

// Appel de la fonction de conversion
// convertMp4ToWav(songFolder);
