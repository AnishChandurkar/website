const pool = require('../config/db');

const getBoards = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT b.*, (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id) AS task_count FROM boards b WHERE b.project_id = ?',
            [req.params.projectId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const createBoard = async (req, res) => {
    try {
        const { name, color } = req.body;
        const [result] = await pool.query(
            'INSERT INTO boards (name, project_id, color) VALUES (?, ?, ?)',
            [name, req.params.projectId, color || '#3498db']
        );

        const boardId = result.insertId;
        const defaultColumns = [
            { name: 'To Do', position: 1, wip_limit: null },
            { name: 'In Progress', position: 2, wip_limit: 5 },
            { name: 'In Review', position: 3, wip_limit: 3 },
            { name: 'Done', position: 4, wip_limit: null }
        ];

        for (const col of defaultColumns) {
            await pool.query(
                'INSERT INTO columns (name, board_id, position, wip_limit) VALUES (?, ?, ?, ?)',
                [col.name, boardId, col.position, col.wip_limit]
            );
        }

        res.status(201).json({
            message: 'board created with default columns!',
            board: { id: boardId, name, color: color || '#3498db' }
        });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const deleteBoard = async (req, res) => {
    try {
        await pool.query('DELETE FROM boards WHERE id = ?', [req.params.boardId]);
        res.json({ message: 'board deleted!' });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

module.exports = { getBoards, createBoard, deleteBoard };