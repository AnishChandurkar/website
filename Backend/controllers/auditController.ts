import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../config/db";

export interface AuthRequest extends Request {
  user?: any;
}

export const getBoardAuditLogs = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { boardId } = req.params;

    const [logs] = await pool.query<RowDataPacket[]>(
      `SELECT 
          al.id, al.task_id, al.event_type, al.old_value, al.new_value, al.created_at,
          t.title as task_title, t.closed_at,
          u_creator.first_name as creator_first_name, u_creator.surname as creator_surname,
          u_editor.first_name as editor_first_name, u_editor.surname as editor_surname,
          (SELECT name FROM columns WHERE board_id = t.board_id ORDER BY position DESC LIMIT 1) as max_col_name
       FROM audit_logs al
       JOIN tasks t ON al.task_id = t.id
       JOIN users u_editor ON al.user_id = u_editor.id
       LEFT JOIN users u_creator ON t.reporter_id = u_creator.id
       WHERE t.board_id = ?
       ORDER BY al.created_at DESC`,
      [boardId]
    );
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch audit logs", error: error.message });
  }
};