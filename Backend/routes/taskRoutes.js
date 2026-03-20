const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireTaskReadAccess, requireTaskWriteAccess } = require('../middleware/taskAuthCheck');
const { getTasks, getTaskById, getChildTasks, createTask, moveTask, updateTask, deleteTask } = require('../controllers/taskController');
const { getBoardProject } = require('../controllers/boardController');

router.get('/:boardId/project', auth, requireTaskReadAccess, getBoardProject);
router.get('/:boardId/tasks', auth, requireTaskReadAccess, getTasks);
router.post('/:boardId/tasks', auth, requireTaskWriteAccess, createTask);
router.get('/tasks/:id', auth, requireTaskReadAccess, getTaskById);
router.get('/tasks/:id/children', auth, requireTaskReadAccess, getChildTasks);
router.put('/tasks/:id/move', auth, requireTaskWriteAccess, moveTask);
router.put('/tasks/:id', auth, requireTaskWriteAccess, updateTask);
router.delete('/tasks/:id', auth, requireTaskWriteAccess, deleteTask);

module.exports = router;

