import express from "express";
import auth from "../middleware/auth";
import { getNotifications, createNotification, deleteNotification } from "../controllers/notificationController";

const router = express.Router();

router.get('/', auth, getNotifications);
router.post('/', auth, createNotification);
router.delete('/:id', auth, deleteNotification);

export default router;
