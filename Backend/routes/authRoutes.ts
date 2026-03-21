import express from "express";
import path from "path";
import auth from "../middleware/auth";
import { AuthRequest } from "../controllers/authController";
import { register, login, refresh, logout, getProfile, updateProfilePicture, updateProfile, changePassword } from "../controllers/authController";
import { getMyTeammates } from "../controllers/teamController";

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/profile/avatar', auth, updateProfilePicture);
router.post('/profile/password', auth, changePassword);
router.get('/teammates', auth, getMyTeammates);

export default router;
