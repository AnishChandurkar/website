const pool = require('../config/db');

const getNotifications = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createNotification = async (req, res) => {
    try {
        const { user_id, message } = req.body;
        const [result] = await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [user_id, message]
        );
        res.status(201).json({
            message: 'Notification created',
            notification: { id: result.insertId, user_id, message }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteNotification = async (req, res) => {
    try {
        await pool.query('DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getNotifications, createNotification, deleteNotification };
