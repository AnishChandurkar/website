import express from "express";
import auth from "../middleware/auth";
import projectRole from "../middleware/projectRole";
import { getBoards, createBoard, deleteBoard } from "../controllers/boardController";

const router = express.Router();

router.get('/:projectId/boards', auth, projectRole(), getBoards);
router.post('/:projectId/boards', auth, projectRole('Project Admin'), createBoard);
router.delete('/:projectId/boards/:boardId', auth, projectRole('Project Admin'), deleteBoard);

export default router;
