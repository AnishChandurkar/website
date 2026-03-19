const pool = require('../config/db');

const requireAdminBoard = async (req, res, next) => {
    try {
        const boardId = req.params.boardId;
        const [boards] = await pool.query('SELECT project_id FROM boards WHERE id = ?', [boardId]);
        
        if (boards.length === 0) {
            return res.status(404).json({ message: 'board not found :/' });
        }
        
        const projectId = boards[0].project_id;
        
        const [role] = await pool.query(
            'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
            [projectId, req.user.id]
        );
        
        if (role.length === 0 || role[0].role !== 'Project Admin') {
            return res.status(403).json({ message: 'only project admins can modify board workflows :/' });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

const requireAdminColumn = async (req, res, next) => {
    try {
        const columnId = req.params.columnId;
        const [projects] = await pool.query(
            'SELECT b.project_id FROM columns c JOIN boards b ON c.board_id = b.id WHERE c.id = ?', 
            [columnId]
        );
        
        if (projects.length === 0) {
            return res.status(404).json({ message: 'column not found :/' });
        }
        
        const projectId = projects[0].project_id;
        
        const [role] = await pool.query(
            'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
            [projectId, req.user.id]
        );
        
        if (role.length === 0 || role[0].role !== 'Project Admin') {
            return res.status(403).json({ message: 'only project admins can modify board workflows :/' });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};

module.exports = { requireAdminBoard, requireAdminColumn };
