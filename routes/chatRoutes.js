const express = require('express');
const router = express.Router();
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');
const { sendChatRequest } = require('../controllers/chatController');

router.post('/request',tokenHandler, validPatient, sendChatRequest);

module.exports = router;