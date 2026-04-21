const express = require('express');
const router = express.Router();
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');
const { addReview, getReviewsByCounselorId } = require('../controllers/reviewController');
const { validCounselor } = require('../middlewares/validCounselor');

router.post('/add',tokenHandler, validPatient, addReview );

router.get('/counselor/:counselorId', tokenHandler, validCounselor, getReviewsByCounselorId);

module.exports = router;