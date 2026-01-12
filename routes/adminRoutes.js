const express = require('express');
const router=express.Router();
const { validAdmin } = require('../middlewares/validAdmin');
const cloudinary = require('../config/cloudinaryConfig');
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const {tokenHandler} = require('../middlewares/tokenHandler');
const multer = require('multer');
const { getCounselorByIdForAdmin, getCounselorForAdmin, createCounselor, answerSupportQuestion, getTotalCounselors } = require('../controllers/adminController');
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'Counselors', 
      allowed_formats: ['jpg', 'jpeg', 'png'],
    },
  });
  
const upload = multer({ storage });

router.post('/create-counselor',tokenHandler, validAdmin,upload.single('profileUrl'), createCounselor);
router.get('/get/:id',tokenHandler, validAdmin,getCounselorByIdForAdmin);

router.get('/get-all',tokenHandler, validAdmin,getCounselorForAdmin)
router.post('/answer-question/:questionId', tokenHandler, validAdmin,answerSupportQuestion);
router.get('/total-counselors', tokenHandler, validAdmin, getTotalCounselors);

module.exports = router;