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
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, column_id, priority, assigned_to, type, description } = req.body;

        if (column_id) {
            const [col] = await pool.query('SELECT wip_limit FROM columns WHERE id = ?', [column_id]);
            if (col.length > 0 && col[0].wip_limit !== null) {
                const [count] = await pool.query('SELECT COUNT(*) AS c FROM tasks WHERE column_id = ?', [column_id]);
                if (count[0].c >= col[0].wip_limit) {
                    return res.status(400).json({
                        message: 'this column is full! move some tasks out before adding new ones'
                    });
                }
            }
        }

        const [result] = await pool.query(
            'INSERT INTO tasks (title, description, type, board_id, column_id, priority, assigned_to, reporter_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description || null, type || 'Task', req.params.boardId, column_id || null, priority || 'MEDIUM', assigned_to || null, req.user.id]
        );

        res.status(201).json({
            message: 'task created!',
            task: { id: result.insertId, title, column_id, priority: priority || 'MEDIUM' }
        });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const moveTask = async (req, res) => {
    try {
        const { column_id } = req.body;
        const taskId = req.params.id;

        const [col] = await pool.query('SELECT wip_limit, name FROM columns WHERE id = ?', [column_id]);
        if (col.length === 0) {
            return res.status(404).json({ message: 'that column doesnt exist :/' });
        }

        if (col[0].wip_limit !== null) {
            const [count] = await pool.query(
                'SELECT COUNT(*) AS c FROM tasks WHERE column_id = ? AND id != ?',
                [column_id, taskId]
            );
            if (count[0].c >= col[0].wip_limit) {
                return res.status(400).json({
                    message: `nope! "${col[0].name}" is at its limit of ${col[0].wip_limit} tasks`
                });
            }
        }

        await pool.query('UPDATE tasks SET column_id = ? WHERE id = ?', [column_id, taskId]);
        res.json({ message: 'task moved!' });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const { title, priority, assigned_to, description, type } = req.body;
        await pool.query(
            `UPDATE tasks SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                type = COALESCE(?, type),
                priority = COALESCE(?, priority),
                assigned_to = COALESCE(?, assigned_to)
             WHERE id = ?`,
            [title, description, type, priority, assigned_to, req.params.id]
        );
        res.json({ message: 'task updated!' });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        res.json({ message: 'task deleted!' });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

module.exports = { getTasks, createTask, moveTask, updateTask, deleteTask };
