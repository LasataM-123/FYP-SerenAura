const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");
const asyncHandler = require("express-async-handler");

/**
 * @route   GET /api/messages/:chatId
 * @desc    Get all messages for a chat
 * @access  Private (patient and counselor)
 */
const getMessages = asyncHandler(async (req, res) => {
      try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   POST /api/messages
 * @desc    Send a message in a chat
 * @access  Private (patient and counselor)
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, senderRole, content } = req.body;
  const io = req.app.get("io");

  if (!chatId || !senderRole || !content) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  if (chat.status !== "active") {
    return res.status(400).json({ message: "Chat is not active" });
  }

  // Save message
  const message = await Message.create({
    chatId,
    senderRole,
    content,
  });

  if (chat.messages) {
    chat.messages.push(message._id);
    await chat.save();
  }

  // Emit real-time message
  io.to(chatId).emit("newMessage", {
    _id: message._id,
    chatId,
    senderRole,
    content,
    createdAt: message.createdAt,
  });

  // 🔔 Notification data
  const notificationData = {
    type: "NEW_CHAT_MESSAGE",
    title: "New Message",
    message:
      senderRole === "Patient"
        ? "New message from patient"
        : "New message from counselor",
    chatId,
  };

  // 🔔 Send notification to Patient (if sender is counselor)
  if (senderRole !== "patient") {
    await sendNotification(
      io,
      chat.patientId,
      "Patient",
      notificationData
    );
  }

  // 🔔 Send notification to Counselor (if sender is patient)
  if (senderRole !== "counselor") {
    await sendNotification(
      io,
      chat.counselorId,
      "Counselor",
      notificationData
    );
  }

  return res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: message,
  });
});



module.exports = {
  getMessages,
  sendMessage
};