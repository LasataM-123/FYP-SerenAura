const express = require('express');
const router=express.Router();
const cloudinary = require('../config/cloudinaryConfig');
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const multer = require('multer');
const { createMeditation } = require('../controllers/meditationController');
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Meditations', 
    resource_type: 'video', 
    allowed_formats: ['mp3', 'wav', 'm4a', 'aac'], 
  },
});

const upload = multer({ storage });

router.post("/create",upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  createMeditation
);

module.exports = router;