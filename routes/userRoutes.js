const express=require('express');
const router=express.Router();
const { forgotPassword, resetPassword, addDOB, getProfile, changePassword} = require('../controllers/userController');
const { tokenHandler } = require('../middlewares/tokenHandler');

router.post('/forgot-password',forgotPassword);
router.post('/reset-password',resetPassword);
router.post('/add-dob',tokenHandler,addDOB);
router.get('/profile',tokenHandler, getProfile);
router.post('/change-password',tokenHandler,changePassword)
module.exports=router;