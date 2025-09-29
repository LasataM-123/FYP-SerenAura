const express=require('express');
const router=express.Router();
const { loginController, register, verifyOTP, resendOTP } = require('../controllers/userController');

router.post('/register',register);
router.post('/login',loginController);
router.post('/verify-otp',verifyOTP);
router.post('/resend-otp/:otpToken',resendOTP);
module.exports=router;