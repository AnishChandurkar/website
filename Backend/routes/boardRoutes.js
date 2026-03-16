const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getBoards, createBoard, deleteBoard } = require('../controllers/boardController');

router.get('/:projectId/boards', auth, getBoards);
router.post('/:projectId/boards', auth, createBoard);
router.delete('/boards/:id', auth, deleteBoard);

module.exports = router;
