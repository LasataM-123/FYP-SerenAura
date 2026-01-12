const express = require('express');
const {  createSupportQuestion, getTopQuestions } = require('../controllers/faqController');
const { tokenHandler } = require('../middlewares/tokenHandler');
const router = express.Router();

router.get('/get-questions', getTopQuestions);
router.post('/create-question', tokenHandler, createSupportQuestion);


module.exports = router;