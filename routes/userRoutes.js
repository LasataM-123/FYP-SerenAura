const express=require('express');
const router=express.Router();
const { loginController, register, resendOTP, refreshTokenController, deleteAccount, verifyOTPAndCreate } = require('../controllers/userController');

router.post('/register',register);
router.post('/login',loginController);
router.post('/verify-otp',verifyOTPAndCreate);
router.get('/resend-otp/:otpToken',resendOTP);
router.post('/refresh',refreshTokenController);
router.delete('/delete-account',deleteAccount);
module.exports=router;