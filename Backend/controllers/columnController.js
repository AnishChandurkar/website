const pool = require('../config/db');

const getColumns = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC',
            [req.params.boardId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const createColumn = async (req, res) => {
    try {
        const { name, wip_limit } = req.body;

        const [existing] = await pool.query(
            'SELECT MAX(position) AS max_pos FROM columns WHERE board_id = ?',
            [req.params.boardId]
        );
        const nextPosition = (existing[0].max_pos || 0) + 1;

        const [result] = await pool.query(
            'INSERT INTO columns (name, board_id, position, wip_limit) VALUES (?, ?, ?, ?)',
            [name, req.params.boardId, nextPosition, wip_limit || null]
        );

        res.status(201).json({
            message: 'column added!',
            column: { id: result.insertId, name, position: nextPosition, wip_limit: wip_limit || null }
        });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const renameColumn = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'column name cant be empty :/' });
        }
        await pool.query('UPDATE columns SET name = ? WHERE id = ?', [name, req.params.columnId]);
        res.json({ message: 'column renamed!' });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const updateColumnLimit = async (req, res) => {
    try {
        const { wip_limit } = req.body;
        await pool.query('UPDATE columns SET wip_limit = ? WHERE id = ?', [wip_limit || null, req.params.columnId]);
        res.json({ message: 'wip limit updated!' });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const reorderColumns = async (req, res) => {
    try {
        const { order } = req.body;
        if (!Array.isArray(order)) {
            return res.status(400).json({ message: 'order must be an array of column ids :/' });
        }

        const queries = order.map((columnId, index) =>
            pool.query('UPDATE columns SET position = ? WHERE id = ? AND board_id = ?',
                [index + 1, columnId, req.params.boardId])
        );
        await Promise.all(queries);

        res.json({ message: 'columns reordered!' });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const deleteColumn = async (req, res) => {
    try {
        const [tasks] = await pool.query(
            'SELECT COUNT(*) AS count FROM tasks WHERE column_id = ?',
            [req.params.columnId]
        );
        if (tasks[0].count > 0) {
            return res.status(400).json({
                message: `can't delete this column — it still has ${tasks[0].count} task(s) in it. move them first!`
            });
        }

        await pool.query('DELETE FROM columns WHERE id = ?', [req.params.columnId]);
        res.json({ message: 'column deleted!' });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

module.exports = { getColumns, createColumn, renameColumn, updateColumnLimit, reorderColumns, deleteColumn };
