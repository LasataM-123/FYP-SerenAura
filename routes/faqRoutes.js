const express = require('express');
const { answerSupportQuestion, createSupportQuestion, getTopQuestions } = require('../controllers/faqController');
const { tokenHandler } = require('../middlewares/tokenHandler');
const router = express.Router();

router.get('/get-questions', getTopQuestions);
router.post('/create-question', tokenHandler, createSupportQuestion);
router.post('/answer-question/:questionId', answerSupportQuestion);

module.exports = router;