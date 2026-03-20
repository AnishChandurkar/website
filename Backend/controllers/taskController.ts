import { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";
import { AuthRequest } from "./authController";

// --- Types & Interfaces ---

interface TaskRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  type: string;
  board_id: number;
  column_id: number | null;
  priority: string;
  assigned_to: number | null;
  reporter_id: number;
  assigned_name?: string;
}

interface WipLimitRow extends RowDataPacket {
  wip_limit: number | null;
  name?: string;
}

interface CountRow extends RowDataPacket {
  c: number;
}

// --- Controllers ---

export const getTasks = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<TaskRow[]>(
      `SELECT t.*, u.first_name AS assigned_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.board_id = ?`,
      [req.params.boardId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, column_id, priority, assigned_to, type, description } = req.body;

    if (column_id) {
      const [col] = await pool.query<WipLimitRow[]>('SELECT wip_limit FROM columns WHERE id = ?', [column_id]);
      const column = col[0];
      if (column && column.wip_limit !== null) {
        const [countRows] = await pool.query<CountRow[]>('SELECT COUNT(*) AS c FROM tasks WHERE column_id = ?', [column_id]);
        const countRow = countRows[0];
        if (countRow && countRow.c >= column.wip_limit) {
          return res.status(400).json({
            message: 'this column is full! move some tasks out before adding new ones'
          });
        }
      }
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO tasks (title, description, type, board_id, column_id, priority, assigned_to, reporter_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || null, type || 'Task', req.params.boardId, column_id || null, priority || 'MEDIUM', assigned_to || null, req.user.id]
    );

    res.status(201).json({
      message: 'task created!',
      task: { id: result.insertId, title, column_id, priority: priority || 'MEDIUM' }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const moveTask = async (req: Request, res: Response) => {
  try {
    const { column_id } = req.body;
    const taskId = req.params.id;

    const [col] = await pool.query<WipLimitRow[]>('SELECT wip_limit, name FROM columns WHERE id = ?', [column_id]);
    const column = col[0];
    if (!column) {
      return res.status(404).json({ message: 'that column doesnt exist :/' });
    }

    if (column.wip_limit !== null) {
      const [countRows] = await pool.query<CountRow[]>(
        'SELECT COUNT(*) AS c FROM tasks WHERE column_id = ? AND id != ?',
        [column_id, taskId]
      );
      const countRow = countRows[0];
      if (countRow && countRow.c >= column.wip_limit) {
        return res.status(400).json({
          message: `nope! "${column.name}" is at its limit of ${column.wip_limit} tasks`
        });
      }
    }

    await pool.query('UPDATE tasks SET column_id = ? WHERE id = ?', [column_id, taskId]);
    res.json({ message: 'task moved!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { title, priority, assigned_to, description, type } = req.body;
    await pool.query(
      `UPDATE tasks SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          type = COALESCE(?, type),
          priority = COALESCE(?, priority),
          assigned_to = COALESCE(?, assigned_to)
       WHERE id = ?`,
      [title, description, type, priority, assigned_to, req.params.id]
    );
    res.json({ message: 'task updated!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'task deleted!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};
