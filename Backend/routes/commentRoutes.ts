import express from "express";
import { getComments, addComment, editComment, deleteComment } from "../controllers/commentController";
import authMiddleware from "../middleware/auth";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", getComments);
router.post("/", addComment);
router.put("/:id", editComment);
router.delete("/:id", deleteComment);

export default router;
