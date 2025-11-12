const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const Patient = require("../models/patientModel");
const Counselor = require("../models/counselorModel");
const Message = require("../models/messageModel");
const mongoose = require("mongoose");

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
    return res.status(200).json({
      success: false,
      message: "You already have an active chat at this time",
      status: "pending",
    });
  }

  chat.status = "active";
  await chat.save();

  io.to(chatId).emit("chatStatusUpdated", { chatId, status: "active" });

  return res.status(200).json({
    message: "Chat request accepted successfully",
    status:"active",
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
 * @desc    Delete pending chats older than 24 hours or expired by appointment
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
    const requestTime = new Date(chat.requestSentDate);
    const appointment = chat.appointmentDate ? new Date(chat.appointmentDate) : null;

    if (appointment) {
      // If appointment is within 24h → expire at appointment
      const twentyFourLater = new Date(requestTime.getTime() + 24 * 60 * 60 * 1000);
      const expiryTime =
        appointment.getTime() - requestTime.getTime() <= 24 * 60 * 60 * 1000
          ? appointment
          : twentyFourLater;

      if (expiryTime <= now) isExpired = true;
    } else {
      // fallback: expire 24h after request
      const expiryTime = new Date(requestTime.getTime() + 24 * 60 * 60 * 1000);
      if (expiryTime <= now) isExpired = true;
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
 * @desc    Delete inactive chats (no messages within 1 hour after appointment)
 * @access  Private
 */
const deleteInactiveChatsAfterAppointment = async (req, res) => {
  try {
    const { userId } = req.params;
    const io = req.app.get("io"); // if using Socket.IO
    console.log("🕒 Cleanup triggered for:", userId);

    const now = new Date();

    // 1️⃣ Find all active chats older than 1 hour
    const chats = await Chat.find({
      status: "active",
      appointmentDate: { $lte: new Date(now.getTime() - 60 * 60 * 1000) },
      $or: [{ patientId: userId }, { counselorId: userId }],
    }).lean();

    console.log("✅ Found chats:", chats.length);

    if (!chats.length) {
      return res.status(200).json({ message: "No inactive chats found" });
    }

    let deletedCount = 0;

    // 2️⃣ Loop over each chat and decide what to do
    for (const chat of chats) {
      console.log(`📂 Checking chat ${chat._id}`);

      // get sender roles directly from Message collection
      const roles = await Message.distinct("senderRole", {
        chatId: new mongoose.Types.ObjectId(chat._id),
      });

      console.log(`💬 Roles found for chat ${chat._id}:`, roles);

      // 3️⃣ If both sides sent messages, just close it
      if (roles.includes("patient") && roles.includes("counselor")) {
        console.log(`✅ Both sides messaged — closing chat ${chat._id}`);
        await Chat.findByIdAndUpdate(chat._id, {
          status: "closed",
          endTime: now,
        });

        io?.to(chat._id.toString()).emit("chatStatusUpdated", {
          chatId: chat._id.toString(),
          status: "closed",
        });
      } else {
        // 4️⃣ If only one side (or none) sent messages → delete chat + messages
        console.log(`🗑️ Deleting chat ${chat._id} — one-sided or inactive`);

        // delete all related messages
        await Message.deleteMany({ chatId: chat._id });

        // pull from both Patient and Counselor arrays safely
        const updates = [];
        if (chat.patientId) {
          updates.push(
            Patient.findByIdAndUpdate(chat.patientId, {
              $pull: { chats: chat._id },
            })
          );
        }
        if (chat.counselorId) {
          updates.push(
            Counselor.findByIdAndUpdate(chat.counselorId, {
              $pull: { chats: chat._id },
            })
          );
        }

        await Promise.allSettled(updates);

        // delete chat itself
        await Chat.findByIdAndDelete(chat._id);
        deletedCount++;

        io?.to(chat._id.toString()).emit("chatStatusUpdated", {
          chatId: chat._id.toString(),
          status: "deleted",
        });
      }
    }

    return res.status(200).json({
      message: `${deletedCount} inactive chat(s) deleted.`,
      deletedCount,
    });
  } catch (err) {
    console.error("❌ Cleanup error:", err);
    return res.status(500).json({ error: "Server error during cleanup." });
  }
};

/**
 * @route  GET /api/chat/get
 * @desc   Get all chat requests for a counselor
 * @access Private (counselor only)
 */
const getAllChatRequests = asyncHandler(async (req, res) => {
  try {
    const counselorId = req.user.id;
    if (!counselorId) {
      return res.status(400).json({ message: "Counselor ID is required" });
    }

    const chats = await Chat.find({ counselorId})
      .populate("patientId", "name profileUrl")
      .sort({ createdAt: -1 }); 

    if (!chats || chats.length === 0) {
      return res.status(200).json({
      success: true,
      message: "Chat requests fetched successfully",
      chats: [],
    });
    }

    return res.status(200).json({
      success: true,
      message: "Chat requests fetched successfully",
      chats,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/**
 * @route  PUT /api/chat/end/:chatId
 * @desc   End an active chat session
 * @access Private (patient and counselor)
 */
const endChatSession = asyncHandler(async (req, res) => {
  try{
    const { chatId } = req.params;
    const io = req.app.get("io");
  
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    chat.status = "ended";
    chat.endTime = new Date();
    await chat.save();
  
    // Notify both users (patient and counselor)
    io.to(chatId).emit("chatStatusUpdated", { chatId, status: "ended" });
  
    return res.status(200).json({
      success:true,
      message: "Chat session has been ended successfully.",
      status: "ended",
    });
  }catch(e){
    return res.status(500).json({ message: e.message });
  }
});

const getChatHistory = asyncHandler(async (req, res) => {
  try{

  }catch(e){
    return res.status(500).json({ message: e.message });
  }
});

module.exports = {
  sendChatRequest,
  acceptChatRequest,
  cancelChatRequest,
  deleteExpiredChatRequests,
  deleteInactiveChatsAfterAppointment,
  getAllChatRequests,
  endChatSession,
};