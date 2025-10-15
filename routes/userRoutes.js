const express=require('express');
const router=express.Router();
const { deleteAccount, forgotPassword, resetPassword, addDOB} = require('../controllers/userController');
const { tokenHandler } = require('../middlewares/tokenHandler');

router.delete('/delete-account',deleteAccount);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password',resetPassword);
router.post('/add-dob',tokenHandler,addDOB);
module.exports=router;