const express=require('express');
const router=express.Router();
const { loginController, register, resendOTP, refreshTokenController, deleteAccount, verifyOTPAndCreate, forgotPassword, verifyOTP, resetPassword, addDOB } = require('../controllers/userController');
const { tokenHandler } = require('../middlewares/tokenHandler');

router.post('/register',register);
router.post('/login',loginController);
router.post('/verify-otp',verifyOTPAndCreate);
router.post('/resend-otp',resendOTP);
router.post('/refresh',refreshTokenController);
router.delete('/delete-account',deleteAccount);
router.post('/forgot-password',forgotPassword);
router.post('/verify',verifyOTP);
router.post('/reset-password',resetPassword);
router.post('/add-dob',tokenHandler,addDOB)
module.exports=router;