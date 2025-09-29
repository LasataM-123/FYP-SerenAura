const express = require('express');
const router=express.Router();
const { createCounselor } = require('../controllers/counselorController');
const cloudinary = require('../config/cloudinaryConfig');
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const multer = require('multer');
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'Counselors', 
      allowed_formats: ['jpg', 'jpeg', 'png'],
    },
  });
  
const upload = multer({ storage });
// Create counselor account
router.post('/create',upload.single('profileUrl'), createCounselor);

module.exports = router;