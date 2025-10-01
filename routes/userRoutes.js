const express=require('express');
const router=express.Router();
const { loginController, register, verifyOTP, resendOTP, refreshTokenController } = require('../controllers/userController');

router.post('/register',register);
router.post('/login',loginController);
router.post('/verify-otp',verifyOTP);
router.get('/resend-otp/:otpToken',resendOTP);
router.post('/refresh',refreshTokenController);
module.exports=router;