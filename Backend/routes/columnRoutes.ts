import express from "express";
import auth from "../middleware/auth";
import { requireAdminBoard, requireAdminColumn } from "../middleware/boardAdminCheck";
import { getColumns, createColumn, renameColumn, updateColumnLimit, reorderColumns, deleteColumn } from "../controllers/columnController";

const router = express.Router();

// fetch all columns for a board
router.get('/:boardId/columns', auth, getColumns);
// create a new column
router.post('/:boardId/columns', auth, requireAdminBoard, createColumn);
router.put('/:boardId/columns/reorder', auth, requireAdminBoard, reorderColumns);
router.put('/columns/:columnId/rename', auth, requireAdminColumn, renameColumn);
router.put('/columns/:columnId/limit', auth, requireAdminColumn, updateColumnLimit);
router.delete('/columns/:columnId', auth, requireAdminColumn, deleteColumn);

export default router;
