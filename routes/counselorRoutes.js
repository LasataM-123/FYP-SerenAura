const express = require('express');
const router=express.Router();
const {getCounselor, getCounselorById, deleteCounselorAccount, editCounselorProfile } = require('../controllers/counselorController');

const { validCounselor } = require('../middlewares/validCounselor');
const {tokenHandler} = require('../middlewares/tokenHandler');

const cloudinary = require('../config/cloudinaryConfig');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Counselors',         
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 500, height: 500, crop: "limit" }],
    },
});

const upload = multer({ storage });
router.get('/get',getCounselor);

router.get('/get/:id',tokenHandler,getCounselorById)

router.delete('/delete',tokenHandler, validCounselor, deleteCounselorAccount)
router.put(
    '/edit-profile',
    tokenHandler,
    validCounselor,
    upload.single('profileUrl'),
    editCounselorProfile
);


module.exports = router;