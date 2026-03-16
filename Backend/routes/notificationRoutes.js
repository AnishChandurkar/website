const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getNotifications, createNotification, deleteNotification } = require('../controllers/notificationController');

router.get('/', auth, getNotifications);
router.post('/', auth, createNotification);
router.delete('/:id', auth, deleteNotification);

module.exports = router;
