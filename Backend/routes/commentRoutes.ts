import express from "express";
import { getComments, addComment, editComment, deleteComment } from "../controllers/commentController";
import authMiddleware from "../middleware/auth";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

// fetch task comments
router.get("/", getComments);
// add a comment
router.post("/", addComment);
router.put("/:id", editComment);
router.delete("/:id", deleteComment);

export default router;
