const express = require('express');
const router=express.Router();
const { createOnboarding } = require('../controllers/onboardingController');
const { tokenHandler } = require('../middlewares/tokenHandler');

router.post('/create',tokenHandler, createOnboarding);

module.exports = router;