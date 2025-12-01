const express=require('express');
const router=express.Router();
const { forgotPassword, resetPassword, addDOB, getProfile, changePassword, deletePatientAccount} = require('../controllers/userController');
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');

router.post('/forgot-password',forgotPassword);
router.post('/reset-password',resetPassword);
router.post('/add-dob',tokenHandler,addDOB);
router.get('/profile',tokenHandler, getProfile);
router.post('/change-password',tokenHandler,changePassword)
router.delete('/delete',tokenHandler, validPatient, deletePatientAccount )

module.exports=router;