const express = require('express');
const router=express.Router();
const { validAdmin } = require('../middlewares/validAdmin');
const cloudinary = require('../config/cloudinaryConfig');
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const {tokenHandler} = require('../middlewares/tokenHandler');
const multer = require('multer');
const { getCounselorByIdForAdmin, getCounselorForAdmin, createCounselor, answerSupportQuestion, adminLogin, editCounselor, deleteCounselor, payCounselor, getAnsweredQuestionById, updateSupportQuestion, getAdminDashboardStats, getWeeklyStats, getMonthlyStats, getPieStats, confirmPayout } = require('../controllers/adminController');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'Counselors', 
      allowed_formats: ['jpg', 'jpeg', 'png'],
    },
  });
  
const upload = multer({ storage });

router.post('/create-counselor',tokenHandler, validAdmin,upload.single('profileUrl'), createCounselor);

router.get('/get/:id',tokenHandler, validAdmin,getCounselorByIdForAdmin);

router.get('/get-all',tokenHandler, validAdmin,getCounselorForAdmin)

router.put('/answer-question/:questionId', tokenHandler, validAdmin,answerSupportQuestion);

router.post('/login',adminLogin);

router.put(
    '/edit-counselor/:id',
    tokenHandler,
    validAdmin,
    upload.single('profileUrl'),
    editCounselor
);

router.delete('/delete-counselor/:id',tokenHandler, validAdmin, deleteCounselor);

router.put('/pay-counselor/:id', tokenHandler, validAdmin, payCounselor);

router.get('/view-question/:id', tokenHandler, validAdmin, getAnsweredQuestionById);

router.put('/update-question/:id', tokenHandler,validAdmin, updateSupportQuestion);

router.get('/earnings', tokenHandler, validAdmin, getAdminDashboardStats)

router.get('/weekly-revenue', tokenHandler, validAdmin, getWeeklyStats);

router.get('/monthly-revenue', tokenHandler, validAdmin, getMonthlyStats)

router.get('/pie-stats', tokenHandler, validAdmin, getPieStats);

router.post('/confirm-payout',tokenHandler,validAdmin,confirmPayout)

module.exports = router;