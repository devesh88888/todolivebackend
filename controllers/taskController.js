// const Task = require('../models/Task');

// // GET /api/tasks
// exports.getTasks = async (req, res, next) => {
//   try {
//     const tasks = await Task.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).lean();

//     res.status(200).json({
//       success: true,
//       message: 'Tasks fetched successfully',
//       count: tasks.length,
//       data: tasks,
//     });
//   } catch (err) {
//     next(err);
//   }
// };


// // POST /api/tasks
// exports.createTask = async (req, res, next) => {
//   try {
//     const { title, status } = req.body;

//     if (!title) {
//       return res.status(400).json({
//         success: false,
//         message: 'Title is required',
//       });
//     }

//     // Assuming req.user is set by authentication middleware
//     const createdBy = req.user._id;

//     const task = await Task.create({ title, status, createdBy });

//     res.status(201).json({
//       success: true,
//       message: 'Task created successfully',
//       data: task,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
// // PUT /api/tasks/:id
// exports.updateTask = async (req, res, next) => {
//   try {
//     const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message: 'Task not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Task updated successfully',
//       data: task,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// exports.deleteTask = async (req, res, next) => {
//   try {
//     const task = await Task.findByIdAndDelete(req.params.id);

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message: 'Task not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Task deleted successfully',
//       data: task,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
