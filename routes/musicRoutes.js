const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinaryConfig');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { createMusic, updateMusic, getRecommendations } = require('../controllers/musicController');
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');

// Separate storages
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'image') {
      return {
        folder: 'Music/Images',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png'],
      };
    }
    if (file.fieldname === 'audio') {
      return {
        folder: 'Music/Audio',
        resource_type: 'video', 
        allowed_formats: ['mp3', 'wav', 'm4a', 'aac', 'mp4'],
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
  createMusic
);


router.put(
  '/update/:musicId',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  updateMusic
);

router.get('/get-recommendations',tokenHandler, validPatient,getRecommendations);

module.exports = router;
