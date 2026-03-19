const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdminBoard, requireAdminColumn } = require('../middleware/boardAdminCheck');
const { getColumns, createColumn, renameColumn, updateColumnLimit, reorderColumns, deleteColumn } = require('../controllers/columnController');

router.get('/:boardId/columns', auth, getColumns);
router.post('/:boardId/columns', auth, requireAdminBoard, createColumn);
router.put('/:boardId/columns/reorder', auth, requireAdminBoard, reorderColumns);
router.put('/columns/:columnId/rename', auth, requireAdminColumn, renameColumn);
router.put('/columns/:columnId/limit', auth, requireAdminColumn, updateColumnLimit);
router.delete('/columns/:columnId', auth, requireAdminColumn, deleteColumn);

module.exports = router;
