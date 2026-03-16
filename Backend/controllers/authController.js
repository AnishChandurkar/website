const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const register = async (req, res) => {
    try {
        const { first_name, surname, emailid, password } = req.body;

        const [existing] = await pool.query(
            'SELECT id FROM users WHERE emailid = ?',
            [emailid]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (first_name, surname, emailid, password_hash) VALUES (?, ?, ?, ?)',
            [first_name, surname, emailid, password_hash]
        );

        const token = jwt.sign(
            { id: result.insertId, emailid },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'User registered!!',
            token,
            user: { id: result.insertId, first_name, surname, emailid }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { emailid, password } = req.body;

        const [users] = await pool.query(
            'SELECT * FROM users WHERE emailid = ?',
            [emailid]
        );
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: user.id, emailid: user.emailid },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                surname: user.surname,
                emailid: user.emailid
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, first_name, surname, emailid, profile_url, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { register, login, getProfile };