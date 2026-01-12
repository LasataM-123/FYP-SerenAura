const express=require('express');
const router=express.Router();
const { forgotPassword, resetPassword, addDOB, getProfile, changePassword, deletePatientAccount, editProfile} = require('../controllers/userController');
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');
const cloudinary = require('../config/cloudinaryConfig');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Patients',         
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 500, height: 500, crop: "limit" }],
    },
});

const upload = multer({ storage });

router.post('/forgot-password',forgotPassword);
router.post('/reset-password',resetPassword);
router.post('/add-dob',tokenHandler,addDOB);
router.get('/profile',tokenHandler, getProfile);
router.post('/change-password',tokenHandler,changePassword)
router.delete('/delete',tokenHandler, validPatient, deletePatientAccount )
router.put(
    '/edit-profile',
    tokenHandler,
    validPatient,
    upload.single('profileUrl'),
    editProfile
);
module.exports=router;