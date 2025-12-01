const express = require('express');
const router=express.Router();
const { createCounselor, getCounselor, getCounselorById, deleteCounselorAccount } = require('../controllers/counselorController');
const cloudinary = require('../config/cloudinaryConfig');
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const {tokenHandler} = require('../middlewares/tokenHandler');
const multer = require('multer');
const { validCounselor } = require('../middlewares/validCounselor');
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

router.get('/get',getCounselor);

router.get('/get/:id',tokenHandler,getCounselorById)

router.delete('/delete',tokenHandler, validCounselor, deleteCounselorAccount)

module.exports = router;