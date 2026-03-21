import { Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../config/db";
import { AuthRequest } from "../controllers/authController";

export const requireTaskReadAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        let boardId = req.params.boardId;
        
        if (!boardId && req.params.id) {
            const [tasks] = await pool.query<RowDataPacket[]>('SELECT board_id FROM tasks WHERE id = ?', [req.params.id]);
            if (tasks.length === 0) return res.status(404).json({ message: 'task not found :/' });
            boardId = tasks[0].board_id;
        }

        if (!boardId) return res.status(400).json({ message: 'board or task id required :(' });

        const [boards] = await pool.query<RowDataPacket[]>('SELECT project_id FROM boards WHERE id = ?', [boardId]);
        if (boards.length === 0) return res.status(404).json({ message: 'board not found :/' });
        
        const projectId = boards[0].project_id;
        
        const [role] = await pool.query<RowDataPacket[]>(
            'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
            [projectId, req.user?.id]
        );
        
        if (role.length === 0) {
            return res.status(403).json({ message: 'you are not a member of this project :/' });
        }
        
        next();
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const requireTaskWriteAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        let boardId = req.params.boardId;
        
        if (!boardId && req.params.id) {
            const [tasks] = await pool.query<RowDataPacket[]>('SELECT board_id FROM tasks WHERE id = ?', [req.params.id]);
            if (tasks.length === 0) return res.status(404).json({ message: 'task not found :/' });
            boardId = tasks[0].board_id;
        }

        if (!boardId) return res.status(400).json({ message: 'board or task id required :(' });

        const [boards] = await pool.query<RowDataPacket[]>('SELECT project_id FROM boards WHERE id = ?', [boardId]);
        if (boards.length === 0) return res.status(404).json({ message: 'board not found :/' });
        
        const projectId = boards[0].project_id;
        
        const [role] = await pool.query<RowDataPacket[]>(
            'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
            [projectId, req.user?.id]
        );
        
        if (role.length === 0) {
            return res.status(403).json({ message: 'you are not a member of this project :/' });
        }
        
        const projectRole = role[0].role;
        if (req.user) {
            req.user.projectRole = projectRole;
        }
        
        if (projectRole === 'Project Viewer') {
            return res.status(403).json({ message: 'Project Viewers cannot modify tasks or boards :/' });
        }
        
        next();
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
