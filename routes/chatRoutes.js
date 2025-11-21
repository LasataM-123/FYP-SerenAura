const express = require('express');
const router = express.Router();
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');
const { validCounselor } = require('../middlewares/validCounselor');
const { sendChatRequest, acceptChatRequest, cancelChatRequest, deleteExpiredChatRequests, deleteInactiveChatsAfterAppointment, getAllChatRequests, endChatSession, getEndedChats, getChatHistory } = require('../controllers/chatController');

router.post('/request',tokenHandler, validPatient, sendChatRequest);

router.put('/accept/:chatId', tokenHandler, validCounselor, acceptChatRequest);

router.delete('/cancel/:chatId', tokenHandler, cancelChatRequest);

router.delete('/cleanup/expired/:chatId', tokenHandler, deleteExpiredChatRequests);

router.delete('/cleanup/inactive/:userId', tokenHandler, deleteInactiveChatsAfterAppointment);

router.get('/get', tokenHandler, validCounselor,getAllChatRequests);

router.put('/end/:chatId', tokenHandler, endChatSession);

router.get('/get/end/:role', tokenHandler, getEndedChats);

router.get('/get-history/:chatId',tokenHandler,getChatHistory);

module.exports = router;