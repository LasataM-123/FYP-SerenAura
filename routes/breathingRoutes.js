const express = require('express');
const router = express.Router();

const cloudinary = require('../config/cloudinaryConfig');
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const multer = require('multer');
const { createExercise, getBreathing, getBreathingById } = require('../controllers/breathingExerciseController');
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'Breathing Exercises', 
      allowed_formats: ['jpg', 'jpeg', 'png'],
    },
  });
  
const upload = multer({ storage });

router.post('/create',upload.single('imageUrl'),createExercise);

router.get('/get',getBreathing);

router.get('/get/:breatheId',tokenHandler, validPatient, getBreathingById);

module.exports = router;