const express = require("express");
const { getComments, addComment, editComment, deleteComment } = require("../controllers/commentController");
const authMiddleware = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", getComments);
router.post("/", addComment);
router.put("/:id", editComment);
router.delete("/:id", deleteComment);

module.exports = router;
