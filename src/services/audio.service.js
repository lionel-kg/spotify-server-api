import ffmpeg from 'fluent-ffmpeg';
import {path as ffmpegPath} from '@ffmpeg-installer/ffmpeg';
import fs, {readdir} from 'fs';
import path from 'path';
import mm from 'music-metadata';
import {promisify} from 'util';
import streamifier from 'streamifier';
import {prisma} from '../config/db';

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

async function processAudioFile(filePath, cloudinary) {
  try {
    const audioFile = filePath;
    const metaData = await getMetadata(audioFile);
    console.log(metaData);
    console.log('audiofile', filePath);

    // Upload the audio file to Cloudinary
    const audioCloudinaryUpload = await cloudinary.uploader.upload(audioFile, {
      resource_type: 'auto',
      folder: 'audio',
    });

    // Check if the artist already exists
    const existingArtist = await prisma.artist.findFirst({
      where: {name: metaData.common.artist},
    });

    // If the artist doesn't exist, create a new one
    const newArtist =
      existingArtist ||
      (await prisma.artist.create({
        data: {
          name: metaData.common.artist,
        },
      }));

    console.log(newArtist);

    // Declare thumbnail here to ensure it's defined
    let thumbnail;

    // Check if the album already exists for the artist
    let where = {
      artistId: newArtist.id,
      title: metaData.common.album,
    };

    const existingAlbum = await prisma.album.findFirst({
      where: where,
    });

    let newAlbum = existingAlbum;

    if (!existingAlbum) {
      // If the album doesn't exist, create a new one
      newAlbum = await prisma.album.create({
        data: {
          title: metaData.common.album,
          artistId: newArtist.id,
          thumbnail: null, // Initialize thumbnail to null
        },
      });

      console.log('album', newAlbum);
      // Upload the image of the album and update the thumbnail field
      const imageUploadPromise = new Promise((resolve, reject) => {
        const imageCloudinaryUpload = cloudinary.uploader.upload_stream(
          {folder: 'image'},
          function (error, result) {
            if (error) {
              console.log(error);
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          },
        );
        streamifier
          .createReadStream(metaData.common.picture[0].data)
          .pipe(imageCloudinaryUpload);
      });

      // Wait for the image upload to complete before continuing
      thumbnail = await imageUploadPromise;

      // Update the thumbnail field in the newly created album
      await prisma.album.update({
        where: {id: newAlbum.id},
        data: {thumbnail: thumbnail},
      });
    } else {
      // If the album exists, use its existing thumbnail
      thumbnail = existingAlbum.thumbnail;
    }

    // Create the audio using Prisma
    const newAudio = await prisma.audio.create({
      data: {
        title: metaData.common.title,
        url: audioCloudinaryUpload.url,
        artistId: newArtist.id,
        albumId: newAlbum?.id,
        duration: metaData.format.duration,
      },
    });

    console.log('Fichier audio téléchargé avec succès');
  } catch (error) {
    console.error(
      `Erreur lors du traitement du fichier audio ${filePath}:`,
      error,
    );
  }
}

export async function getMetadata(filePath) {
  // Implémentez la logique pour récupérer les métadonnées du fichier audio
  // Utilisez une bibliothèque comme 'music-metadata' ou autre

  // Exemple avec music-metadata (il faut l'installer avec npm install music-metadata)
  const mm = require('music-metadata');
  const metadata = await mm.parseFile(filePath);
  return metadata;
}

export async function getWavMetadata(filePath) {
  const mm = require('music-metadata');
  const metadata = await mm.parseFile(filePath);
  return metadata;
}

export async function processAudioFilesInDirectory(cloudinary) {
  try {
    const directoryPath = path.join(__dirname, '../../songs');
    const subDirectories = await fs.promises.readdir(directoryPath);

    for (const subDirectory of subDirectories) {
      const subDirectoryPath = path.join(directoryPath, subDirectory);
      // Vérifiez si le chemin est un dossier
      const isDirectory = (
        await promisify(fs.stat)(subDirectoryPath)
      ).isDirectory();

      if (isDirectory) {
        const files = await fs.promises.readdir(subDirectoryPath);

        for (const file of files) {
          const filePath = path.join(subDirectoryPath, file);
          // Vérifiez si le fichier est un fichier audio
          if (isAudioFile(filePath)) {
            await processAudioFile(filePath, cloudinary);
          }
        }
      }
    }
    console.log('Traitement des fichiers audio terminé.');
  } catch (error) {
    console.error('Erreur lors de la lecture des répertoires:', error);
  }
}

// Fonction pour vérifier si le fichier est un fichier audio
function isAudioFile(filePath) {
  return (
    filePath.endsWith('.mp3') ||
    filePath.endsWith('.wav') ||
    filePath.endsWith('.m4a') ||
    filePath.endsWith('.mp4')
  );
}

// Spécifiez le chemin du répertoire d'entrée (MP4)
// const audioFolder = './audios/mp4';

// const audio = './audios/mp4/Snoop Dogg - Gin And Juice.mp3';
// const audio = 'audios/wav/m4a/9-01 Amsterdam.m4a';

// getMp4Metadata(audio);

// getWavMetadata(audio);

// Appel de la fonction de conversion
// convertMp4ToWav(audioFolder);
