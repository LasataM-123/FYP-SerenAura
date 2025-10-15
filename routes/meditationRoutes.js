const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinaryConfig');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { createMeditation, updateMeditation } = require('../controllers/meditationController');

// Separate storages
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'image') {
      return {
        folder: 'Meditations/Images',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png'],
      };
    }
    if (file.fieldname === 'audio') {
      return {
        folder: 'Meditations/Audio',
        resource_type: 'video', // Cloudinary treats audio as video
        allowed_formats: ['mp3', 'wav', 'm4a', 'aac'],
      };
    }
    return null;
  },
});

// One uploader for both fields
const upload = multer({ storage: imageStorage });

router.post(
  '/create',
  async (req, res, next) => {
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'audio', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        console.error(err);
        return res.status(400).json({ message: 'File upload failed', error: err.message });
      }
      next();
    });
  },
  createMeditation
);

router.put(
  '/update/:meditationId',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  updateMeditation
);

module.exports = router;
