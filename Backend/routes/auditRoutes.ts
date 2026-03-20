import express from "express";
import auth from "../middleware/auth";
import { getBoardAuditLogs } from "../controllers/auditController";

const router = express.Router();

router.get("/boards/:boardId/audit", auth, getBoardAuditLogs);

export default router;