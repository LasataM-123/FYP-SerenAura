require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { connection } = require('./config/dbConfig');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const server = http.createServer(app);

connection();

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join chat room
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat room: ${chatId}`);
  });

  // When counselor accepts a chat
  socket.on('chatAccepted', (data) => {
    io.to(data.chatId).emit('chatStatusUpdated', { chatId: data.chatId, status: 'active' });
  });

  // When counselor cancels a chat
  socket.on('chatCancelled', (data) => {
    io.to(data.chatId).emit('chatStatusUpdated', { chatId: data.chatId, status: 'closed' });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.set('io', io);


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
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
