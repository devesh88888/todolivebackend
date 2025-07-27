const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'in progress', 'completed'], // ✅ match frontend values
    default: 'pending',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List', // ✅ shared list reference
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
