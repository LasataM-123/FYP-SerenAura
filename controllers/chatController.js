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

  // Check if any pending chat already exists
  const existingChat = await Chat.findOne({
    patientId,
    counselorId,
    status: { $in: ["pending", "active"] },
  });

  if (existingChat) {
    return res.status(400).json({ message: "Chat already exists or the request is pending" });
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

  return res.status(201).json({ message: "Chat request sent", chat });
});

module.exports = {
  sendChatRequest,
};