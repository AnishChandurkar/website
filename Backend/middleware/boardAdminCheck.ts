import { Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../config/db";
import { AuthRequest } from "../controllers/authController";

// types & interfaces

interface BoardProjectRow extends RowDataPacket {
  project_id: number;
}

interface RoleRow extends RowDataPacket {
  role: string;
}

// middleware

// check if user is a board admin
export const requireAdminBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const boardId = req.params.boardId;
    const [boards] = await pool.query<BoardProjectRow[]>('SELECT project_id FROM boards WHERE id = ?', [boardId]);

    const board = boards[0];
    if (!board) {
      return res.status(404).json({ message: 'board not found :/' });
    }

    const projectId = board.project_id;

    const [roleRows] = await pool.query<RoleRow[]>(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, req.user.id]
    );

    const roleRow = roleRows[0];
    if (!roleRow || roleRow.role !== 'Project Admin') {
      return res.status(403).json({ message: 'only project admins can modify board workflows :/' });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

// check if user is a column admin
export const requireAdminColumn = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const columnId = req.params.columnId;
    const [projects] = await pool.query<BoardProjectRow[]>(
      'SELECT b.project_id FROM columns c JOIN boards b ON c.board_id = b.id WHERE c.id = ?',
      [columnId]
    );

    const project = projects[0];
    if (!project) {
      return res.status(404).json({ message: 'column not found :/' });
    }

    const projectId = project.project_id;

    const [roleRows] = await pool.query<RoleRow[]>(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, req.user.id]
    );

    const roleRow = roleRows[0];
    if (!roleRow || roleRow.role !== 'Project Admin') {
      return res.status(403).json({ message: 'only project admins can modify board workflows :/' });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};
