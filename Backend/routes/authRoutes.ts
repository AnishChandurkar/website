import express from "express";
import multer from "multer";
import path from "path";
import auth from "../middleware/auth";
import { AuthRequest } from "../controllers/authController";
import { register, login, refresh, logout, getProfile, updateProfilePicture } from "../controllers/authController";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'avatars'));
  },
  filename: (req, _file, cb) => {
    const authReq = req as AuthRequest;
    const uniqueName = `${authReq.user?.id}_${Date.now()}${path.extname(_file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/profile', auth, getProfile);
router.post('/profile/avatar', auth, upload.single('avatar'), updateProfilePicture);

export default router;
