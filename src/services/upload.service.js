import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Dossier de destination pour les fichiers audio
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Nom de fichier unique
  },
});

export const upload = multer({storage: storage});
