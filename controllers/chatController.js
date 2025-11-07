const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const Patient = require("../models/patientModel");
const Counselor = require("../models/counselorModel");

/**
 * @route   POST /api/chat/request
 * @desc    Send a chat request from patient to counselor
 * @access  Private (patient only)
 */
const sendChatRequest = asyncHandler(async (req, res) => {
  const { patientId, counselorId, appointmentDate } = req.body;

  if (!patientId || !counselorId || !appointmentDate) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const chat = await Chat.create({
    patientId,
    counselorId,
    appointmentDate,
    status: "pending",
  });

  // Push chat ID to both Patient and Counselor
  await Patient.findByIdAndUpdate(patientId, { $push: { chat: chat._id } });
  await Counselor.findByIdAndUpdate(counselorId, { $push: { chat: chat._id } });

  return res.status(201).json({
    success: true,
    message: "Chat request sent successfully",
    chat,
  });
});


/**
 * @route   PUT /api/chat/accept/:chatId
 * @desc    Accept chat request
 * @access  Private (counselor only)
 */
const acceptChatRequest = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const io = req.app.get("io");

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ success: false, message: "Chat not found" });
  }

  if (chat.status !== "pending") {
    return res.status(400).json({ success: false, message: "Chat already processed" });
  }

  // Check for conflict
  const conflictingChat = await Chat.findOne({
    counselorId: chat.counselorId,
    status: "active",
    appointmentDate: chat.appointmentDate,
  });

  if (conflictingChat) {
    return res.status(400).json({
      success: false,
      message: "You already have an active chat at this time",
    });
  }

  chat.status = "active";
  await chat.save();

  io.to(chatId).emit("chatStatusUpdated", { chatId, status: "active" });

  return res.status(200).json({
    success: true,
    message: "Chat request accepted successfully",
    chat,
  });
});


/**
 * @route   DELETE /api/chat/cancel/:chatId
 * @desc    Cancel chat request
 * @access  Private 
 */
const cancelChatRequest = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const io = req.app.get("io");

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found" });

  await Patient.findByIdAndUpdate(chat.patientId, { $pull: { chat: chat._id } });
  await Counselor.findByIdAndUpdate(chat.counselorId, { $pull: { chat: chat._id } });

  await Chat.findByIdAndDelete(chatId);

  io.to(chatId).emit("chatStatusUpdated", { chatId, status: "closed" });

  return res.status(200).json({ message: "Chat request cancelled" , status:"closed"});
});


/**
 * @route   DELETE /api/chat/cleanup/expired/:chatId
 * @desc    Delete pending chats older than 24 hours for a specific user
 * @access  Private
 */
const deleteExpiredChatRequests = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const io = req.app.get("io"); 

  const now = new Date();
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(200).json({ status: "" });
  }

  let isExpired = false;

  if (chat.status === "pending") {
    if (chat.appointmentDate) {
      const appointmentDate = new Date(chat.appointmentDate);

      // If appointmentDate is in the past or less than 24 hours from now, expire it
      if (appointmentDate <= now) {
        isExpired = true;
      }
    } else {
      // fallback: check 24 hours since requestSentDate
      const expiryTime = new Date(chat.requestSentDate.getTime() + 24 * 60 * 60 * 1000);
      if (expiryTime <= now) {
        isExpired = true;
      }
    }

    if (isExpired) {
      // remove references
      await Patient.findByIdAndUpdate(chat.patientId, { $pull: { chat: chat._id } });
      await Counselor.findByIdAndUpdate(chat.counselorId, { $pull: { chat: chat._id } });
      await Chat.deleteOne({ _id: chat._id });

      io.to(chatId).emit("chatStatusUpdated", { chatId, status: "closed" });
      return res.status(200).json({ status: "closed" });
    }
  }

  return res.status(200).json({ status: chat.status });
});

/**
 * @route   DELETE /api/chat/cleanup/inactive/:userId
 * @desc    Delete inactive chats (no messages within 1 hour of appointment) for a specific user
 * @access  Private
 */
const deleteInactiveChatsAfterAppointment = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const now = new Date();

  // Find chats where 1 hour has passed since appointment
  const chats = await Chat.find({
    status: "active",
    appointmentDate: { $lt: new Date(now.getTime() - 60 * 60 * 1000) },
    $or: [{ patientId: userId }, { counselorId: userId }],
  }).populate({
    path: "messages",
    select: "senderRole", // we only need senderRole to check
  });

  const expiredChats = [];

  for (const chat of chats) {
    const senderRoles = chat.messages?.map(msg => msg.senderRole) || [];

    // Check if both participants have NOT sent any messages
    const patientSent = senderRoles.includes("patient");
    const counselorSent = senderRoles.includes("counselor");

    // If neither or only one side sent messages → consider session inactive
    if (!(patientSent && counselorSent)) {
      expiredChats.push(chat);
      await Patient.findByIdAndUpdate(chat.patientId, { $pull: { chats: chat._id } });
      await Counselor.findByIdAndUpdate(chat.counselorId, { $pull: { chats: chat._id } });
      await Chat.findByIdAndDelete(chat._id);
    }
  }

  if (expiredChats.length === 0) {
    return res.status(200).json({ message: "No expired or inactive chats found" });
  }

  return res.status(200).json({
    message: `${expiredChats.length} inactive chat(s) deleted — session expired`,
    deletedChats: expiredChats.map(c => c._id),
  });
});


module.exports = {
  sendChatRequest,
  acceptChatRequest,
  cancelChatRequest,
  deleteExpiredChatRequests,
  deleteInactiveChatsAfterAppointment,
};