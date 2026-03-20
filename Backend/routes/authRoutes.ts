import express from "express";
import path from "path";
import auth from "../middleware/auth";
import { AuthRequest } from "../controllers/authController";
import { register, login, refresh, logout, getProfile, updateProfilePicture } from "../controllers/authController";

const router = express.Router();



router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/profile', auth, getProfile);
router.post('/profile/avatar', auth, updateProfilePicture);

export default router;
