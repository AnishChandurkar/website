const pool = require('../config/db');

const getProjects = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT p.* FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = ? AND p.is_archived = FALSE',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getArchivedProjects = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT p.* FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = ? AND p.is_archived = TRUE',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createProject = async (req, res) => {
    try {
        const { name, status } = req.body;
        const [result] = await pool.query(
            'INSERT INTO projects (name,status,owner_id) VALUES (?,?,?)',
            [name, status || 'Planning', req.user.id]
        );
        await pool.query(
            'INSERT INTO project_members (project_id,user_id,role) VALUES (?, ?, ?)',
            [result.insertId, req.user.id, 'Admin']
        );

        res.status(201).json({
            message: 'Project created!',
            project: { id: result.insertId, name, status: status || 'Planning' }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateProject = async (req, res) => {
    try {
        const { name, status, progress } = req.body;
        await pool.query(
            'UPDATE projects SET name = COALESCE(?, name), status = COALESCE(?, status), progress = COALESCE(?, progress) WHERE id = ?',
            [name, status, progress, req.params.id]
        );
        res.json({ message: 'Project updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const archiveProject = async (req, res) => {
    try {
        const { is_archived } = req.body;
        await pool.query(
            'UPDATE projects SET is_archived = ? WHERE id = ?',
            [is_archived, req.params.id]
        );
        res.json({ message: is_archived ? 'Project archived' : 'Project restored' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteProject = async (req, res) => {
    try {
        await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getProjects, getArchivedProjects, createProject, updateProject, archiveProject, deleteProject };
