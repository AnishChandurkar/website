const pool = require('../config/db');

const getBoards = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT b.*, (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id) AS task_count FROM boards b WHERE b.project_id = ?',
            [req.params.projectId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createBoard = async (req, res) => {
    try {
        const { name, color } = req.body;
        const [result] = await pool.query(
            'INSERT INTO boards (name, project_id, color) VALUES (?, ?, ?)',
            [name, req.params.projectId, color || '#3498db']
        );
        res.status(201).json({
            message: 'Board created',
            board: { id: result.insertId, name, color: color || '#3498db' }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteBoard = async (req, res) => {
    try {
        await pool.query('DELETE FROM boards WHERE id = ?', [req.params.boardId]);
        res.json({ message: 'Board deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getBoards, createBoard, deleteBoard };