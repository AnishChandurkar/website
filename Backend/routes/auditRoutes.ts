import express from "express";
import auth from "../middleware/auth";
import { getBoardAuditLogs } from "../controllers/auditController";

const router = express.Router();

// get audit logs for a board
router.get("/:boardId/audit", auth, getBoardAuditLogs);

export default router;