import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../config/db";

export interface AuthRequest extends Request {
  user?: { id: number; emailid?: string; projectRole?: string };
}

// fetch audit logs for the board
export const getBoardAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId } = req.params;

    const [logs] = await pool.query<RowDataPacket[]>(
      `SELECT 
          al.id, al.task_id, al.event_type, al.old_value, al.new_value, al.created_at, al.is_closed, al.is_resolved,
          COALESCE(t.title, al.task_title, '[Deleted Task]') as task_title,
          COALESCE(u_creator.first_name, 'Unknown') as creator_first_name, 
          COALESCE(u_creator.surname, '') as creator_surname,
          COALESCE(u_editor.first_name, SUBSTRING_INDEX(al.user_name, ' ', 1), 'Unknown') as editor_first_name, 
          COALESCE(u_editor.surname, SUBSTRING_INDEX(al.user_name, ' ', -1), '') as editor_surname,
          (SELECT name FROM columns WHERE board_id = COALESCE(t.board_id, al.board_id) ORDER BY position DESC LIMIT 1) as max_col_name
       FROM audit_logs al
       LEFT JOIN tasks t ON al.task_id = t.id
       LEFT JOIN users u_editor ON al.user_id = u_editor.id
       LEFT JOIN users u_creator ON t.reporter_id = u_creator.id
       WHERE COALESCE(t.board_id, al.board_id) = ?
       ORDER BY al.created_at DESC`,
      [boardId]
    );
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch audit logs", error: (error as Error).message });
  }
};

export const getTaskAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [logs] = await pool.query<RowDataPacket[]>(
      `SELECT 
          al.id, al.task_id, al.event_type, al.old_value, al.new_value, al.created_at, al.is_closed, al.is_resolved,
          COALESCE(t.title, al.task_title, '[Deleted Task]') as task_title,
          COALESCE(u_creator.first_name, 'Unknown') as creator_first_name, 
          COALESCE(u_creator.surname, '') as creator_surname,
          COALESCE(u_editor.first_name, SUBSTRING_INDEX(al.user_name, ' ', 1), 'Unknown') as editor_first_name, 
          COALESCE(u_editor.surname, SUBSTRING_INDEX(al.user_name, ' ', -1), '') as editor_surname,
          (SELECT name FROM columns WHERE board_id = COALESCE(t.board_id, al.board_id) ORDER BY position DESC LIMIT 1) as max_col_name
       FROM audit_logs al
       LEFT JOIN tasks t ON al.task_id = t.id
       LEFT JOIN users u_editor ON al.user_id = u_editor.id
       LEFT JOIN users u_creator ON t.reporter_id = u_creator.id
       WHERE al.task_id = ?
       ORDER BY al.created_at DESC`,
      [id]
    );
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task activity timeline", error: (error as Error).message });
  }
};