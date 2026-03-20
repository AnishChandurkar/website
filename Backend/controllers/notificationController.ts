import { Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";
import { AuthRequest } from "./authController";

// --- Types & Interfaces ---

interface NotificationRow extends RowDataPacket {
  id: number;
  user_id: number;
  message: string;
  created_at?: Date;
}

// --- Controllers ---

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [rows] = await pool.query<NotificationRow[]>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const createNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, message } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [user_id, message]
    );
    res.status(201).json({
      message: 'notification created!!',
      notification: { id: result.insertId, user_id, message }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await pool.query('DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'notification deleted!!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};
