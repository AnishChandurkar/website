const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTasks, getTaskById, getChildTasks, createTask, moveTask, updateTask, deleteTask } = require('../controllers/taskController');
const { getBoardProject } = require('../controllers/boardController');

router.get('/:boardId/project', auth, getBoardProject);
router.get('/:boardId/tasks', auth, getTasks);
router.post('/:boardId/tasks', auth, createTask);
router.get('/tasks/:id', auth, getTaskById);
router.get('/tasks/:id/children', auth, getChildTasks);
router.put('/tasks/:id/move', auth, moveTask);
router.put('/tasks/:id', auth, updateTask);
router.delete('/tasks/:id', auth, deleteTask);

module.exports = router;

