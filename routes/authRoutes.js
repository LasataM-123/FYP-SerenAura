const express=require('express');
const router=express.Router();
const { loginController, register, resendOTP, refreshTokenController, verifyOTPAndCreate, verifyOTP,  googleAuth } = require('../controllers/authController');

router.post('/register',register);
router.post('/login',loginController);
router.post('/verify-otp',verifyOTPAndCreate);
router.post('/resend-otp',resendOTP);
router.post('/refresh',refreshTokenController);
router.post('/verify',verifyOTP);
router.post('/google', googleAuth);

module.exports=router;