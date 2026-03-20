import express from "express";
import auth from "../middleware/auth";
import { getTasks, createTask, moveTask, updateTask, deleteTask } from "../controllers/taskController";

const router = express.Router();

router.get('/:boardId/tasks', auth, getTasks);
router.post('/:boardId/tasks', auth, createTask);
router.put('/tasks/:id/move', auth, moveTask);
router.put('/tasks/:id', auth, updateTask);
router.delete('/tasks/:id', auth, deleteTask);

export default router;
