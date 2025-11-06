const express = require('express');
const router = express.Router();
const { tokenHandler } = require('../middlewares/tokenHandler');
const { validPatient } = require('../middlewares/validPatient');
const { validCounselor } = require('../middlewares/validCounselor');
const { sendChatRequest, acceptChatRequest, cancelChatRequest, deleteExpiredChatRequests, deleteInactiveChatsAfterAppointment } = require('../controllers/chatController');

router.post('/request',tokenHandler, validPatient, sendChatRequest);
router.put('/accept/:chatId', tokenHandler, validCounselor, acceptChatRequest);
router.delete('/cancel/:chatId', tokenHandler, validCounselor, cancelChatRequest);
router.delete('/cleanup/expired/:chatId', tokenHandler, deleteExpiredChatRequests);
router.delete('/cleanup/inactive/:userId', tokenHandler, deleteInactiveChatsAfterAppointment);

module.exports = router;