import express from "express";
import auth from "../middleware/auth";
import { requireTaskReadAccess, requireTaskWriteAccess } from "../middleware/taskAuthCheck";
import { getTasks, getTaskById, getChildTasks, createTask, moveTask, updateTask, deleteTask, closeTask, reSyncStories } from "../controllers/taskController";
import { getBoardProject } from "../controllers/boardController";
import { getTaskAuditLogs } from "../controllers/auditController";

const router = express.Router();

// get project for a board
router.get('/:boardId/project', auth, requireTaskReadAccess, getBoardProject);
// fetch all tasks on a board
router.get('/:boardId/tasks', auth, requireTaskReadAccess, getTasks);
// create a new task
router.post('/:boardId/tasks', auth, requireTaskWriteAccess, createTask);
router.get('/tasks/:id', auth, requireTaskReadAccess, getTaskById);
router.get('/tasks/:id/children', auth, requireTaskReadAccess, getChildTasks);
router.put('/tasks/:id/move', auth, requireTaskWriteAccess, moveTask);
router.put('/tasks/:id/close', auth, requireTaskWriteAccess, closeTask);
router.put('/tasks/:id', auth, requireTaskWriteAccess, updateTask);
router.put('/:boardId/sync-stories', auth, requireTaskWriteAccess, reSyncStories);
router.delete('/tasks/:id', auth, requireTaskWriteAccess, deleteTask);
router.get('/tasks/:id/audit', auth, requireTaskReadAccess, getTaskAuditLogs);

export default router;
