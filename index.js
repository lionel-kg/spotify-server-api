const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

function convertMp4ToWav(songFolder) {
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
const songFolder = './songs/mp4';

// Appel de la fonction de conversion
convertMp4ToWav(songFolder);
