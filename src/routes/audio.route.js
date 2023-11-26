import express from 'express';
const router = express.Router();
import {prisma} from '../config/db';
import {upload} from '../services/upload.service';
import {getWavMetadata, convertMp4ToWav} from '../services/audio.service';
import cloudinary from '../config/cloudinary';

// Create Audio
router.post('/', async (req, res) => {
  try {
    const audio = await prisma.audio.create({data: req.body});
    res.status(201).json(audio);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Read Audios
router.get('/', async (req, res) => {
  try {
    const audios = await prisma.audio.findMany({
      include: {
        album: true,
        artist: true,
      },
    });
    res.status(200).json(audios);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Read Audio
router.get('/:id', async (req, res) => {
  try {
    const audio = await prisma.audio.findUnique({
      where: {id: parseInt(req.params.id)},
      include: {
        album: true,
        artist: true,
      },
    });
    res.status(200).json(audio);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Update Audio
router.put('/:id', async (req, res) => {
  try {
    const audio = await prisma.audio.update({
      where: {id: parseInt(req.params.id)},
      data: req.body,
      include: {
        album: true,
        artist: true,
      },
    });
    res.status(200).json(audio);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// Delete Audio
router.delete('/:id', async (req, res) => {
  try {
    const audio = await prisma.audio.delete({
      where: {id: parseInt(req.params.id)},
    });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal server error'});
  }
});

// uploadHandler.js
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const audioFile = req.file;
    let metaData = null;
    let imageCloudinaryUpload = null;
    if (
      audioFile.mimetype === 'audio/mpeg' ||
      audioFile.mimetype === 'video/mp4'
    ) {
      const file = await convertMp4ToWav(audioFile.path);
      const metadataPromise = getWavMetadata(file);
      metaData = await metadataPromise;
    } else {
      const metadataPromise = getWavMetadata(audioFile.path);
      metaData = await metadataPromise;
    }

    // Upload the audio file to Cloudinary
    const audioCloudinaryUpload = await cloudinary.uploader.upload(
      audioFile.path,
      {
        resource_type: 'auto',
        folder: 'audio', // Optional: Set the Cloudinary folder
      },
    );

    // if (metaData.common.picture !== undefined) {
    //   imageCloudinaryUpload = await cloudinary.uploader.upload_stream(
    //     uploadStream => {
    //       metaData.common.picture[0].data.pipe(uploadStream);
    //     },
    //     {
    //       resource_type: 'image',
    //       folder: 'image', // Facultatif : Définissez le dossier Cloudinary
    //     },
    //   );
    //   // Faire quelque chose avec le résultat de l'upload de l'image (si nécessaire)
    // }

    // Faire quelque chose avec le résultat de l'upload de l'audio (par exemple, enregistrez le chemin du fichier dans la base de données)
    res.status(200).json({
      audio: audioCloudinaryUpload,
      image: imageCloudinaryUpload, // Ajout du résultat de l'upload de l'image dans la réponse
      metaData: metaData.common,
      message: 'Fichier audio téléchargé avec succès',
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({error: 'Erreur lors du téléchargement du fichier audio'});
  }
});

export default router;
