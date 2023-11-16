const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

function convertMp4ToWav(inputPath, outputPath) {
  // Vérifier si le fichier d'entrée existe
  if (!fs.existsSync(inputPath)) {
    console.error("Le fichier d'entrée n'existe pas.");
    return;
  }

  // Utiliser fluent-ffmpeg pour effectuer la conversion
  ffmpeg(inputPath)
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
}

// Spécifiez le chemin du fichier d'entrée (MP4) et de sortie (WAV)
const inputFilePath = './songs/mp4/Lean Wit Me.mp4';
const outputFilePath = './songs/wav/test.wav';

// Appel de la fonction de conversion
convertMp4ToWav(inputFilePath, outputFilePath);
