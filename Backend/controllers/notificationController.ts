import { Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";
import { AuthRequest } from "./authController";

// types & interfaces

interface NotificationRow extends RowDataPacket {
  id: number;
  user_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at?: Date;
}

export const internalCreateNotification = async (userId: number, type: string, message: string) => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
      [userId, type, message]
    );
    return result.insertId;
  } catch (error) {
    console.error('Failed to create notification internally:', error);
    return null;
  }
};

// controllers

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
    const { user_id, type, message } = req.body;
    const insertId = await internalCreateNotification(user_id, type, message);
    res.status(201).json({
      message: 'notification created!!',
      notification: { id: insertId, user_id, type, message }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'notification marked as read!!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'all notifications marked as read!!' });
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
