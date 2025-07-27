const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Change this in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// ✅ Load routes *after* io is defined
const taskRoutes = require('./routes/taskRoutes')(io);
const listRoutes = require('./routes/listRoutes')(io); // ✅ Shared list routes

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/lists', listRoutes);

// ✅ Real-time Socket.IO logic with rooms
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  socket.on('joinList', (listId) => {
    socket.join(listId);
    console.log(`🔁 Socket ${socket.id} joined list ${listId}`);
  });

  socket.on('leaveList', (listId) => {
    socket.leave(listId);
    console.log(`⛔ Socket ${socket.id} left list ${listId}`);
  });

  socket.on('createTask', ({ listId, task }) => {
    io.to(listId).emit('taskCreated', task);
  });

  socket.on('updateTask', ({ listId, task }) => {
    io.to(listId).emit('taskUpdated', task);
  });

  socket.on('deleteTask', ({ listId, taskId }) => {
    io.to(listId).emit('taskDeleted', taskId);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
