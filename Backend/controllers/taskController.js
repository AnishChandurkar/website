const pool = require('../config/db');

const getTasks = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT t.*, u.first_name AS assigned_name
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.id
             WHERE t.board_id = ?`,
            [req.params.boardId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, status, priority, assigned_to } = req.body;
        const [result] = await pool.query(
            'INSERT INTO tasks (title, status, priority, board_id, assigned_to) VALUES (?, ?, ?, ?, ?)',
            [title, status || 'TODO', priority || 'MEDIUM', req.params.boardId, assigned_to || null]
        );
        res.status(201).json({
            message: 'Task created',
            task: { id: result.insertId, title, status: status || 'TODO', priority: priority || 'MEDIUM' }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const { title, status, priority, assigned_to } = req.body;
        await pool.query(
            `UPDATE tasks SET
                title = COALESCE(?, title),
                status = COALESCE(?, status),
                priority = COALESCE(?, priority),
                assigned_to = COALESCE(?, assigned_to)
             WHERE id = ?`,
            [title, status, priority, assigned_to, req.params.id]
        );
        res.json({ message: 'Task updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
