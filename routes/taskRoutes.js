// routes/taskRoutes.js
const express = require('express');
const Task = require('../models/Task');
const authMiddleware = require('../middlewares/authMiddleware');

module.exports = function (io) {
  const router = express.Router();
  router.use(authMiddleware);

  // GET all tasks
  router.get('/', async (req, res) => {
    try {
      const tasks = await Task.find({ createdBy: req.userId }).sort({ createdAt: -1 });
      res.json({ data: tasks });
    } catch (err) {
      console.error('Fetch tasks error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch tasks' });
    }
  });

  // CREATE task
  router.post('/', async (req, res) => {
    try {
      const task = await Task.create({ ...req.body, createdBy: req.userId });
      io.emit('taskCreated', task);
      res.status(201).json({ data: task });
    } catch (err) {
      console.error('Create task error:', err);
      res.status(500).json({ error: err.message || 'Failed to create task' });
    }
  });

  // UPDATE task
  router.put('/:id', async (req, res) => {
    try {
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, createdBy: req.userId },
        req.body,
        { new: true }
      );
      if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });
      io.emit('taskUpdated', task);
      res.json({ data: task });
    } catch (err) {
      console.error('Update task error:', err);
      res.status(500).json({ error: err.message || 'Failed to update task' });
    }
  });

  // DELETE task
  router.delete('/:id', async (req, res) => {
    try {
      const task = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
      if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });
      io.emit('taskDeleted', req.params.id);
      res.json({ message: 'Task deleted' });
    } catch (err) {
      console.error('Delete task error:', err);
      res.status(500).json({ error: err.message || 'Failed to delete task' });
    }
  });

  // GET single task
  router.get('/:id', async (req, res) => {
    try {
      const task = await Task.findOne({ _id: req.params.id, createdBy: req.userId });
      if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });
      res.json({ data: task });
    } catch (err) {
      console.error('Fetch single task error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch task' });
    }
  });

  return router;
};
