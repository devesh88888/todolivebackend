const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config'); // Uses your updated connectDB.js
const authRoutes = require('./routes/authRoutes');

dotenv.config();

// ✅ Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// ✅ Connect to MongoDB
connectDB();

// ✅ Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*', // ⛔ Use '*' only for dev
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// ✅ Load routes AFTER io is available
const taskRoutes = require('./routes/taskRoutes')(io);
const listRoutes = require('./routes/listRoutes')(io);

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/lists', listRoutes);

// ✅ WebSocket Events
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('joinList', (listId) => {
    socket.join(listId);
    console.log(`🟢 Socket ${socket.id} joined room ${listId}`);
  });

  socket.on('leaveList', (listId) => {
    socket.leave(listId);
    console.log(`🔴 Socket ${socket.id} left room ${listId}`);
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
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// ✅ Start the server
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
