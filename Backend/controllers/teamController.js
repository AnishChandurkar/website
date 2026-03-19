const pool = require('../config/db');

const getMembers = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.id, u.first_name, u.surname, u.emailid, u.profile_url, pm.role
             FROM project_members pm
             JOIN users u ON pm.user_id = u.id
             WHERE pm.project_id = ?`,
            [req.params.projectId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(' , error: error.message });
    }
};

const addMember = async (req, res) => {
    try {
        const { emailid, role } = req.body;
        const validRoles = ['Project Admin', 'Project Member', 'Project Viewer'];
        const assignedRole = validRoles.includes(role) ? role : 'Project Member';

        const [users] = await pool.query('SELECT id FROM users WHERE emailid = ?', [emailid]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'user not found with that email :(' });
        }

        if (users[0].id === req.user.id) {
            return res.status(400).json({ message: 'you are already a member of this project :/' });
        }

        await pool.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
            [req.params.projectId, users[0].id, assignedRole]
        );

        res.status(201).json({ message: 'member added!!', role: assignedRole });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'user is already a member of this project :/' });
        }
        res.status(500).json({ message: 'something went wrong :(' , error: error.message });
    }
};

const removeMember = async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
            [req.params.projectId, req.params.userId]
        );
        res.json({ message: 'member removed!!' });
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(' , error: error.message });
    }
};

module.exports = { getMembers, addMember, removeMember };
