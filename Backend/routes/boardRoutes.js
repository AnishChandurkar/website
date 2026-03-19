const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const projectRole = require('../middleware/projectRole');
const { getBoards, createBoard, deleteBoard, getBoardProject } = require('../controllers/boardController');

router.get('/:projectId/boards', auth, projectRole(), getBoards);
router.post('/:projectId/boards', auth, projectRole('Project Admin'), createBoard);
router.delete('/:projectId/boards/:boardId', auth, projectRole('Project Admin'), deleteBoard);

module.exports = router;
