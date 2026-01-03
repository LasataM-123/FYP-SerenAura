const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const Patient = require("../models/patientModel");
const Counselor = require("../models/counselorModel");
const Message = require("../models/messageModel");
const mongoose = require("mongoose");
const { sendNotification } = require('../service/notificationService');

/**
 * @route   POST /api/chat/request
 * @desc    Send a chat request from patient to counselor
 * @access  Private (patient only)
 */
const sendChatRequest = asyncHandler(async (req, res) => {
  const { patientId, counselorId, appointmentDate } = req.body;
  const io = req.app.get('io');
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
  await sendNotification(io, counselorId, 'Counselor', {
  type: 'REQUEST_SENT',
  senderId: patientId,
  senderModel: 'Patient',
  title: 'New Patient Request',
  message: 'A patient wants to connect with you.'
});

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
    await sendNotification(io, chat.patientId, 'Patient', {
      type: 'REQUEST_ACCEPTED',
      senderId: chat.counselorId,
      senderModel: 'Counselor',
      title: 'Request Accepted',
      message: 'Your counselor is ready to talk.'
    });
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
  
  const activeUserId = req.user.id; 

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found" });

  const isPatientCancelling = activeUserId.toString() === chat.patientId.toString();
  
  const recipientId = isPatientCancelling ? chat.counselorId : chat.patientId;
  const recipientModel = isPatientCancelling ? 'Counselor' : 'Patient';
  const senderId = activeUserId;
  const senderModel = isPatientCancelling ? 'Patient' : 'Counselor';

  // 2. Cleanup Database
  await Patient.findByIdAndUpdate(chat.patientId, { $pull: { chat: chat._id } });
  await Counselor.findByIdAndUpdate(chat.counselorId, { $pull: { chat: chat._id } });
  await Chat.findByIdAndDelete(chatId);

  // 3. Socket emit for real-time UI updates in the chat room
  io.to(chatId).emit("chatStatusUpdated", { chatId, status: "closed" });

  // 4. Send the Notification to the OTHER party
  await sendNotification(io, recipientId, recipientModel, {
    type: 'REQUEST_CANCELLED',
    senderId: senderId,
    senderModel: senderModel,
    title: 'Request Cancelled',
    message: isPatientCancelling 
      ? 'A patient has cancelled their chat request.' 
      : 'Your counselor has cancelled the request.'
  });

  return res.status(200).json({ message: "Chat request cancelled", status: "closed" });
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
      const twentyFourLater = new Date(requestTime.getTime() + 24 * 60 * 60 * 1000);
      const expiryTime = appointment.getTime() - requestTime.getTime() <= 24 * 60 * 60 * 1000
          ? appointment
          : twentyFourLater;

      if (expiryTime <= now) isExpired = true;
    } else {
      const expiryTime = new Date(requestTime.getTime() + 24 * 60 * 60 * 1000);
      if (expiryTime <= now) isExpired = true;
    }

    if (isExpired) {
      // --- NOTIFICATION LOGIC ---
      // Notify Patient
      await sendNotification(io, chat.patientId, 'Patient', {
        type: 'REQUEST_EXPIRED', 
        title: 'Request Expired',
        message: 'Your chat request expired as it was not accepted within the time limit.'
      });

      // Notify Counselor
      await sendNotification(io, chat.counselorId, 'Counselor', {
        type: 'REQUEST_EXPIRED',
        title: 'Request Expired',
        message: 'A pending chat request has expired and is no longer available.'
      });

      // Remove references and delete
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
    const io = req.app.get("io");
    const now = new Date();

    const chats = await Chat.find({
      status: "active",
      appointmentDate: { $lte: new Date(now.getTime() - 60 * 60 * 1000) },
      $or: [{ patientId: userId }, { counselorId: userId }],
    }).lean();

    if (!chats.length) {
      return res.status(200).json({ message: "No inactive chats found" });
    }

    let deletedCount = 0;

    for (const chat of chats) {
      const roles = await Message.distinct("senderRole", {
        chatId: new mongoose.Types.ObjectId(chat._id),
      });

      if (roles.includes("patient") && roles.includes("counselor")) {
        continue;
      }

      // --- NOTIFICATION LOGIC ---
      // Notify both parties before deletion
      const notificationData = {
        type: 'REQUEST_CANCELLED',
        title: 'Session Closed',
        message: 'Your chat session was closed due to inactivity.'
      };

      await sendNotification(io, chat.patientId, 'Patient', notificationData);
      await sendNotification(io, chat.counselorId, 'Counselor', notificationData);

      // Cleanup
      await Message.deleteMany({ chatId: chat._id });

      const updates = [];
      if (chat.patientId) {
        updates.push(Patient.findByIdAndUpdate(chat.patientId, { $pull: { chat: chat._id } }));
      }
      if (chat.counselorId) {
        updates.push(Counselor.findByIdAndUpdate(chat.counselorId, { $pull: { chat: chat._id } }));
      }

      await Promise.allSettled(updates);
      await Chat.findByIdAndDelete(chat._id);
      deletedCount++;

      io?.to(chat._id.toString()).emit("chatStatusUpdated", {
        chatId: chat._id.toString(),
        status: "closed",
      });
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

/**
 * @route  GET /api/chat/get/end/:role
 * @desc   Get all ended chats
 * @access Private (patient and counselor) 
 */
const getEndedChats = async (req, res) => {
  try {
    const {role} = req.params;
    const userId = req.user.id;

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    if (role === "counselor") {
      const chats = await Chat.find({
        counselorId: userId,
        status: "ended",
      })
        .populate("patientId", "name profileUrl")
        .sort({ updatedAt: -1 });

      return res.json({ success: true, chats });
    }

    if (role === "patient") {
      const chats = await Chat.find({
        patientId: userId,
        status: "ended",

      })
        .populate("counselorId", "name profileUrl speciality experience")
        .sort({ updatedAt: -1 });

      return res.json({ success: true, chats });
    }

    return res.status(400).json({ message: "Invalid role" });
  } catch (err) {
    console.error("Error fetching ended chats:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @route  GET /api/chat/get-history
 * @desc   Get chat history
 * @access Private (patient and counselor)
 */
const getChatHistory = asyncHandler(async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate("patientId", "name profileUrl")
      .populate("counselorId", "name profileUrl");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const patientName = chat.patientId?.name || "Patient";
    const counselorName = chat.counselorId?.name || "Counselor";

    const patientProfileUrl = chat.patientId?.profileUrl || null;
    const counselorProfileUrl = chat.counselorId?.profileUrl || null;

    // Fetch all messages for this chat
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    // Manual "time ago" formatter
    const formatTimeAgo = (date) => {
      if (!date) return "";
      const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

      const intervals = {
        year: 31536000,
        month: 2592000,
        day: 86400,
        hour: 3600,
        minute: 60,
      };

      for (let key in intervals) {
        const interval = Math.floor(seconds / intervals[key]);
        if (interval >= 1) {
          return `${interval} ${key}${interval > 1 ? "s" : ""} ago`;
        }
      }

      return "just now";
    };

    // Format messages with profileUrl + timeAgo
    const formattedMessages = messages.map((msg) => {
      const isPatient = msg.senderRole === "patient";

      return {
        _id: msg._id,
        senderRole: msg.senderRole,
        senderName: isPatient ? patientName : counselorName,
        senderProfileUrl: isPatient 
          ? patientProfileUrl 
          : counselorProfileUrl,
        content: msg.content,
        createdAt: msg.createdAt,
        timeAgo: formatTimeAgo(msg.createdAt),
      };
    });

    // Add session ended info if endTime exists
    let sessionEnded = null;
    if (chat.endTime) {
      sessionEnded = {
        endTime: chat.endTime,
        timeAgo: formatTimeAgo(chat.endTime),
      };
    }

    return res.status(200).json({
      chatId: chat._id,

      patient: {
        name: patientName,
        profileUrl: patientProfileUrl,
      },

      counselor: {
        name: counselorName,
        profileUrl: counselorProfileUrl,
      },

      messages: formattedMessages,

      sessionEnded,
    });

  } catch (e) {
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
  getEndedChats,
  getChatHistory
};