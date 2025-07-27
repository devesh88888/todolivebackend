const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');

const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Live Collaborative To-Do Backend is Running');
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);



// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
