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

// ✅ Initialize io before using it
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// ✅ Import routes *after* io is initialized
const taskRoutes = require('./routes/taskRoutes')(io);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('createTask', task => io.emit('taskCreated', task));
  socket.on('updateTask', task => io.emit('taskUpdated', task));
  socket.on('deleteTask', id => io.emit('taskDeleted', id));

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
