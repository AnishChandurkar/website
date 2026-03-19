const pool = require('../config/db');

const projectRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const projectId = req.params.projectId || req.params.id;

            if (!projectId) {
                return res.status(400).json({ message: 'project id is required :(' });
            }

            const [rows] = await pool.query(
                'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
                [projectId, req.user.id]
            );

            if (rows.length === 0) {
                return res.status(403).json({ message: 'you are not a member of this project :/' });
            }

            const userRole = rows[0].role;

            if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`
                });
            }

            req.projectRole = userRole;
            next();
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    };
};

module.exports = projectRole;
