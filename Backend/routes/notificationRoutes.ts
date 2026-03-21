import express from "express";
import auth from "../middleware/auth";
import { getNotifications, createNotification, deleteNotification, markAsRead, markAllAsRead } from "../controllers/notificationController";

const router = express.Router();

router.get('/', auth, getNotifications);
router.post('/', auth, createNotification);
router.put('/:id/read', auth, markAsRead);
router.put('/read-all', auth, markAllAsRead);
router.delete('/:id', auth, deleteNotification);

export default router;
