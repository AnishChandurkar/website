import express from "express";
import auth from "../middleware/auth";
import { requireTaskReadAccess, requireTaskWriteAccess } from "../middleware/taskAuthCheck";
import { getTasks, getTaskById, getChildTasks, createTask, moveTask, updateTask, deleteTask } from "../controllers/taskController";
import { getBoardProject } from "../controllers/boardController";

const router = express.Router();

router.get('/:boardId/project', auth, requireTaskReadAccess, getBoardProject);
router.get('/:boardId/tasks', auth, requireTaskReadAccess, getTasks);
router.post('/:boardId/tasks', auth, requireTaskWriteAccess, createTask);
router.get('/tasks/:id', auth, requireTaskReadAccess, getTaskById);
router.get('/tasks/:id/children', auth, requireTaskReadAccess, getChildTasks);
router.put('/tasks/:id/move', auth, requireTaskWriteAccess, moveTask);
router.put('/tasks/:id', auth, requireTaskWriteAccess, updateTask);
router.delete('/tasks/:id', auth, requireTaskWriteAccess, deleteTask);

export default router;
