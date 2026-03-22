import { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";
import { syncAllBoardStories } from "./taskController";

interface ColumnRow extends RowDataPacket {
  id: number;
  name: string;
  board_id: number;
  position: number;
  wip_limit: number | null;
}

interface MaxPosRow extends RowDataPacket {
  max_pos: number | null;
}

interface TaskCountRow extends RowDataPacket {
  count: number;
}

// get all columns for a board
export const getColumns = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<ColumnRow[]>(
      'SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC',
      [req.params.boardId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

// create a new column
export const createColumn = async (req: Request, res: Response) => {
  try {
    const { name, wip_limit } = req.body;

    const [existing] = await pool.query<MaxPosRow[]>(
      'SELECT MAX(position) AS max_pos FROM columns WHERE board_id = ?',
      [req.params.boardId]
    );
    const firstRow = existing[0];
    const nextPosition = ((firstRow?.max_pos) || 0) + 1;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO columns (name, board_id, position, wip_limit) VALUES (?, ?, ?, ?)',
      [name, req.params.boardId, nextPosition, wip_limit || 3]
    );

    res.status(201).json({
      message: 'column added!',
      column: { id: result.insertId, name, position: nextPosition, wip_limit: wip_limit || null }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

// rename a column
export const renameColumn = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'column name cant be empty :/' });
    }
    await pool.query('UPDATE columns SET name = ? WHERE id = ?', [name, req.params.columnId]);
    await pool.query('UPDATE tasks SET column_name = ? WHERE column_id = ?', [name, req.params.columnId]);

    const [cols] = await pool.query<RowDataPacket[]>('SELECT board_id FROM columns WHERE id = ?', [req.params.columnId]);
    if (cols.length > 0) {
      await syncAllBoardStories(cols[0].board_id);
    }

    res.json({ message: 'column renamed!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const updateColumnLimit = async (req: Request, res: Response) => {
  try {
    const { wip_limit } = req.body;
    const newLimit = wip_limit ? Number(wip_limit) : null;
    if (newLimit !== null) {
      const [tasks] = await pool.query<TaskCountRow[]>(
        'SELECT COUNT(*) AS count FROM tasks WHERE column_id = ? AND closed_at IS NULL AND type != "Story"',
        [req.params.columnId]
      );
      const currentCount = tasks[0]?.count || 0;
      if (newLimit < currentCount) {
        return res.status(400).json({
          message: `can't set WIP limit to ${newLimit}, as this column already has ${currentCount} tasks! move some out first :(`
        });
      }
    }

    await pool.query('UPDATE columns SET wip_limit = ? WHERE id = ?', [newLimit, req.params.columnId]);
    res.json({ message: 'wip limit updated!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const reorderColumns = async (req: Request, res: Response) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ message: 'order must be an array of column ids :/' });
    }

    const queries: Promise<any>[] = [];

    for (let i = 0; i < order.length; i++) {
      const columnId = order[i];
      queries.push(
        pool.query(
          'UPDATE columns SET position = ? WHERE id = ? AND board_id = ?',
          [i + 1, columnId, req.params.boardId]
        )
      );
    }

    await Promise.all(queries);
    await syncAllBoardStories(req.params.boardId as string);

    res.json({ message: 'columns reordered!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const deleteColumn = async (req: Request, res: Response) => {
  try {
    const [tasks] = await pool.query<TaskCountRow[]>(
      "SELECT COUNT(*) AS count FROM tasks WHERE column_id = ? AND closed_at IS NULL AND type != 'Story'",
      [req.params.columnId]
    );
    const firstTask = tasks[0];
    if (firstTask && firstTask.count > 0) {
      return res.status(400).json({
        message: `can't delete this column, it still has tasks in it. move them first!`
      });
    }


    const [cols] = await pool.query<RowDataPacket[]>('SELECT board_id FROM columns WHERE id = ?', [req.params.columnId]);
    const boardId = cols.length > 0 ? cols[0].board_id : null;

    await pool.query('DELETE FROM columns WHERE id = ?', [req.params.columnId]);


    if (boardId) await syncAllBoardStories(boardId);

    res.json({ message: 'column deleted!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};
