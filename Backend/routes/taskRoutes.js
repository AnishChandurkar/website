const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTasks, createTask, moveTask, updateTask, deleteTask } = require('../controllers/taskController');

router.get('/:boardId/tasks', auth, getTasks);
router.post('/:boardId/tasks', auth, createTask);
router.put('/tasks/:id/move', auth, moveTask);
router.put('/tasks/:id', auth, updateTask);
router.delete('/tasks/:id', auth, deleteTask);

module.exports = router;
