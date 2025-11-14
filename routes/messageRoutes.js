const express = require("express");
const { tokenHandler } = require("../middlewares/tokenHandler");
const { getMessages, sendMessage } = require("../controllers/messageController");
const router = express.Router();

router.get("/:chatId", tokenHandler, getMessages);
router.post("/", tokenHandler, sendMessage); 

module.exports = router;