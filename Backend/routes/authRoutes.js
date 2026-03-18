const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const { register, login, refresh, logout, getProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/profile', auth, getProfile);

module.exports = router;
