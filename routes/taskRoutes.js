const express = require('express');
const Task = require('../models/Task');
const List = require('../models/List');
const authMiddleware = require('../middlewares/authMiddleware');

module.exports = function (io) {
  const router = express.Router();
  router.use(authMiddleware);

  // Helper: Check if user is in list members
  const isUserInList = async (listId, userId) => {
    const list = await List.findById(listId);
    return list && (list.createdBy.equals(userId) || list.members.includes(userId));
  };

  // 🔍 GET all tasks in lists where user is a member
  router.get('/', async (req, res) => {
    try {
      const accessibleLists = await List.find({
        $or: [{ createdBy: req.userId }, { members: req.userId }],
      }).select('_id');

      const listIds = accessibleLists.map(list => list._id);
      const tasks = await Task.find({ listId: { $in: listIds } }).sort({ createdAt: -1 });

      res.json({ data: tasks });
    } catch (err) {
      console.error('Fetch tasks error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch tasks' });
    }
  });

  // ➕ CREATE task in a shared list
  router.post('/', async (req, res) => {
    try {
      const { listId, title, status } = req.body;
      if (!await isUserInList(listId, req.userId)) {
        return res.status(403).json({ error: 'Not authorized for this list' });
      }

      const task = await Task.create({ title, status, listId, createdBy: req.userId });
      io.to(listId).emit('taskCreated', task); // 🎯 emit to specific room
      res.status(201).json({ data: task });
    } catch (err) {
      console.error('Create task error:', err);
      res.status(500).json({ error: err.message || 'Failed to create task' });
    }
  });

  // ✏️ UPDATE task
  router.put('/:id', async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);
      if (!task || !(await isUserInList(task.listId, req.userId))) {
        return res.status(404).json({ error: 'Task not found or unauthorized' });
      }

      Object.assign(task, req.body);
      await task.save();

      io.to(task.listId.toString()).emit('taskUpdated', task);
      res.json({ data: task });
    } catch (err) {
      console.error('Update task error:', err);
      res.status(500).json({ error: err.message || 'Failed to update task' });
    }
  });

  // ❌ DELETE task
  router.delete('/:id', async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);
      if (!task || !(await isUserInList(task.listId, req.userId))) {
        return res.status(404).json({ error: 'Task not found or unauthorized' });
      }

      await task.deleteOne();
      io.to(task.listId.toString()).emit('taskDeleted', task._id);
      res.json({ message: 'Task deleted' });
    } catch (err) {
      console.error('Delete task error:', err);
      res.status(500).json({ error: err.message || 'Failed to delete task' });
    }
  });

  // 👁️ GET single task
  router.get('/:id', async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);
      if (!task || !(await isUserInList(task.listId, req.userId))) {
        return res.status(404).json({ error: 'Task not found or unauthorized' });
      }

      res.json({ data: task });
    } catch (err) {
      console.error('Fetch single task error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch task' });
    }
  });

  return router;
};
