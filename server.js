require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { connection } = require('./config/dbConfig');
const errorHandler = require('./middlewares/errorHandler');
const initMoodCron = require('./jobs/moodJob');
const Patient = require('./models/patientModel');
const Mood = require('./models/moodModel');
const Counselor = require('./models/counselorModel');
const { sendNotification } = require('./service/notificationService');

const app = express();
const server = http.createServer(app);

// Database Connection
connection();

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // 1. Register for private notifications (Used in RootLayout)
  socket.on('registerNotifications', (userId) => {
    socket.join(userId.toString());
    console.log(`User ${userId} registered for private notifications`);
  });

  // 2. Join a specific chat room for messaging
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat room: ${chatId}`);
  });

  // 3. When counselor ACCEPTS a chat
  socket.on('chatAccepted', (data) => {
    const { chatId, patientId, counselorName } = data;

    // Update the status for everyone in the chat UI
    io.to(chatId).emit('chatStatusUpdated', { chatId, status: 'active' });

    // Send the ALERT notification to the specific patient
    if (patientId) {
      io.to(patientId.toString()).emit('new_notification', {
        title: "Session Started! 🎉",
        message: `${counselorName || 'A counselor'} has accepted your request. You can start chatting now.`,
        type: "CHAT_ACCEPTED",
        chatId: chatId
      });
    }
  });

  // 4. When counselor CANCELS/DECLINES a chat
  socket.on('chatCancelled', (data) => {
    const { chatId, patientId, counselorName } = data;

    // Update the status for everyone in the chat UI
    io.to(chatId).emit('chatStatusUpdated', { chatId, status: 'closed' });

    // Send the ALERT notification to the specific patient
    if (patientId) {
      io.to(patientId.toString()).emit('new_notification', {
        title: "Request Declined",
        message: `Your chat request with ${counselorName || 'the counselor'} was cancelled.`,
        type: "CHAT_CANCELLED",
        chatId: chatId
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.set('io', io);
initMoodCron(io);

// Middleware
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/counselors', require('./routes/counselorRoutes'));
app.use('/api/onboarding', require('./routes/onboardingRoutes'));
app.use('/api/meditation', require('./routes/meditationRoutes'));
app.use('/api/music', require('./routes/musicRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/recent-search', require('./routes/recentSearchRoutes'));
app.use('/api/favourite', require('./routes/favouriteRoutes'));
app.use('/api/playlist', require('./routes/playlistRoutes'));
app.use('/api/mood', require('./routes/moodRoutes'));
app.use('/api/breathe', require('./routes/breathingRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));  
app.use('/api/faq', require('./routes/faqRoutes'));

app.patch('/api/user/notifications', async (req, res) => {
  const { userId, userType, enabled } = req.body;
  const Model = userType === 'Counselor' ? Counselor : Patient;
  await Model.findByIdAndUpdate(userId, { notificationsEnabled: enabled });
  res.status(200).send("Settings updated");
});

app.post('/api/notifications/trigger-mood-check', async (req, res) => {
  const { userId, userType } = req.body;
  const io = req.app.get('io');
  
  try {

    if (userType === 'Patient') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 2. Check ONLY this specific patient
      const entry = await Mood.findOne({
        patientId: userId,
        entryDate: { $gte: today }
      });

      if (!entry) {
        await sendNotification(io, userId, 'Patient', {
          type: 'MOOD_REMINDER',
          title: 'Mood Check-in',
          message: "Hi! You haven't logged your mood today."
        });
      }
    }
  
    res.status(200).send("Triggered");
  } catch (err) {
    console.error("Trigger Error:", err);
    res.status(500).send("Internal Server Error");
  }
});
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});