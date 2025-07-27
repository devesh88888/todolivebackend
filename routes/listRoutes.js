const express = require('express');
const List = require('../models/List');
const User = require('../models/User');
const authMiddleware = require('../middlewares/authMiddleware');

module.exports = function (io) {
  const router = express.Router();
  router.use(authMiddleware);

  // 📄 Get all lists the user has access to (owner or member)
  router.get('/', async (req, res) => {
    try {
      const lists = await List.find({
        $or: [
          { createdBy: req.userId },
          { members: req.userId }
        ]
      }).sort({ createdAt: -1 });

      res.json({ data: lists });
    } catch (err) {
      console.error('List fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch lists' });
    }
  });

  // ➕ Create a new list (members by email)
  router.post('/', async (req, res) => {
    try {
      const { name, members = [] } = req.body;

      // Look up user IDs by email
      const users = await User.find({ email: { $in: members } });
      const foundEmails = users.map(u => u.email);
      const missing = members.filter(email => !foundEmails.includes(email));

      if (missing.length > 0) {
        return res.status(400).json({ error: `Users not found: ${missing.join(', ')}` });
      }

      const memberIds = users.map(u => u._id);

      const list = await List.create({
        name,
        createdBy: req.userId,
        members: memberIds
      });

      io.to(list._id.toString()).emit('listCreated', list);
      res.status(201).json({ data: list });
    } catch (err) {
      console.error('Create list error:', err);
      res.status(500).json({ error: 'Failed to create list' });
    }
  });

  // 👥 Add members to an existing list using email
  router.put('/:id/members', async (req, res) => {
    try {
      const list = await List.findOne({ _id: req.params.id, createdBy: req.userId });

      if (!list) return res.status(404).json({ error: 'List not found or unauthorized' });

      const { members } = req.body;

      const users = await User.find({ email: { $in: members } });
      const foundEmails = users.map(u => u.email);
      const missing = members.filter(email => !foundEmails.includes(email));

      if (missing.length > 0) {
        return res.status(400).json({ error: `Users not found: ${missing.join(', ')}` });
      }

      const newMemberIds = users.map(user => user._id).filter(id => !list.members.includes(id));
      list.members.push(...newMemberIds);
      await list.save();

      res.json({ data: list });
    } catch (err) {
      console.error('Add members error:', err);
      res.status(500).json({ error: 'Failed to add members' });
    }
  });

  // 🧾 Get a single list by ID
  router.get('/:id', async (req, res) => {
    try {
      const list = await List.findById(req.params.id);
      if (!list || (!list.createdBy.equals(req.userId) && !list.members.includes(req.userId))) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      res.json({ data: list });
    } catch (err) {
      console.error('Fetch single list error:', err);
      res.status(500).json({ error: 'Failed to fetch list' });
    }
  });

  // ❌ Delete list (only creator)
  router.delete('/:id', async (req, res) => {
    try {
      const list = await List.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
      if (!list) return res.status(404).json({ error: 'List not found or unauthorized' });

      res.json({ message: 'List deleted' });
    } catch (err) {
      console.error('Delete list error:', err);
      res.status(500).json({ error: 'Failed to delete list' });
    }
  });

  return router;
};
