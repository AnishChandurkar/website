import { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";

// --- Types & Interfaces ---

interface BoardRow extends RowDataPacket {
  id: number;
  name: string;
  project_id: number;
  color: string;
  task_count?: number;
}

interface DefaultColumn {
  name: string;
  position: number;
  wip_limit: number | null;
}

// --- Controllers ---

export const getBoards = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<BoardRow[]>(
      'SELECT b.*, (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id) AS task_count FROM boards b WHERE b.project_id = ?',
      [req.params.projectId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const createBoard = async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO boards (name, project_id, color) VALUES (?, ?, ?)',
      [name, req.params.projectId, color || '#3498db']
    );

    const boardId = result.insertId;
    const defaultColumns: DefaultColumn[] = [
      { name: 'To Do', position: 1, wip_limit: null },
      { name: 'In Progress', position: 2, wip_limit: 5 },
      { name: 'In Review', position: 3, wip_limit: 3 },
      { name: 'Done', position: 4, wip_limit: null }
    ];

    for (const col of defaultColumns) {
      await pool.query(
        'INSERT INTO columns (name, board_id, position, wip_limit) VALUES (?, ?, ?, ?)',
        [col.name, boardId, col.position, col.wip_limit]
      );
    }

    res.status(201).json({
      message: 'board created with default columns!',
      board: { id: boardId, name, color: color || '#3498db' }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const deleteBoard = async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM boards WHERE id = ?', [req.params.boardId]);
    res.json({ message: 'board deleted!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const getBoardProject = async (req: Request, res: Response): Promise<any> => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT project_id FROM boards WHERE id = ?',
            [req.params.boardId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'board not found :/' });
        res.json({ project_id: rows[0].project_id });
    } catch (error: any) {
        res.status(500).json({ message: 'something went wrong :(', error: error.message });
    }
};
