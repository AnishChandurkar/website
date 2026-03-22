import { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";
import { internalCreateNotification } from "./notificationController";

export interface AuthRequest extends Request {
  user?: any;
}

export const getComments = async (req: Request, res: Response) => {
  try {
    const [comments] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, u.first_name, u.surname 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.task_id = ? 
       ORDER BY c.created_at ASC`,
      [req.params.taskId]
    );
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ message: "failed to fetch comments :(", error: error.message });
  }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "comment cannot be empty :/" });

    const [commenterRows] = await pool.query<RowDataPacket[]>("SELECT first_name, surname FROM users WHERE id = ?", [req.user!.id]);
    const commenterName = commenterRows.length > 0 ? `${commenterRows[0].first_name} ${commenterRows[0].surname}` : 'Someone';

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)",
      [req.params.taskId, req.user!.id, content]
    );

    const [taskInfo] = await pool.query<RowDataPacket[]>("SELECT title, board_id FROM tasks WHERE id = ?", [req.params.taskId]);
    const taskTitle = taskInfo.length > 0 ? taskInfo[0].title : null;
    const boardId = taskInfo.length > 0 ? taskInfo[0].board_id : null;

    await pool.query(
      "INSERT INTO audit_logs (task_id, task_title, board_id, user_id, user_name, event_type, new_value) VALUES (?, ?, ?, ?, ?, 'COMMENT_ADDED', ?)",
      [req.params.taskId, taskTitle, boardId, req.user!.id, commenterName, content.substring(0, 50)]
    );

    // Notify assigned user
    const [taskRows] = await pool.query<RowDataPacket[]>(
      "SELECT title, assigned_to FROM tasks WHERE id = ?",
      [req.params.taskId]
    );
    if (taskRows.length > 0) {
      const task = taskRows[0];
      if (task.assigned_to && task.assigned_to !== req.user!.id) {
        await internalCreateNotification(
          task.assigned_to,
          'COMMENT_ADDED',
          `${commenterName} commented on your task: ${task.title}`
        );
      }
    }

    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      for (const mention of mentions) {
        const surname = mention.substring(1);
        const [userRows] = await pool.query<RowDataPacket[]>(
          "SELECT id FROM users WHERE surname = ? OR first_name = ?",
          [surname, surname]
        );
        if (userRows.length > 0 && userRows[0].id !== req.user!.id) {
          await internalCreateNotification(
            userRows[0].id,
            'USER_MENTIONED',
            `${commenterName} mentioned you in a comment`
          );
        }
      }
    }

    res.status(201).json({ message: "comment added!" });
  } catch (error: any) {
    res.status(500).json({ message: "couldnt add comment :(", error: error.message });
  }
};

export const editComment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "comment cannot be empty :/" });

    const [existing] = await pool.query<RowDataPacket[]>("SELECT content, user_id, task_id FROM comments WHERE id = ?", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: "comment not found :/" });
    if (existing[0].user_id !== req.user!.id) return res.status(403).json({ message: "not your comment! :(" });

    await pool.query("UPDATE comments SET content = ? WHERE id = ?", [content, req.params.id]);

    const [taskInfo2] = await pool.query<RowDataPacket[]>("SELECT title, board_id FROM tasks WHERE id = ?", [existing[0].task_id]);
    const [userInfo2] = await pool.query<RowDataPacket[]>("SELECT first_name, surname FROM users WHERE id = ?", [req.user!.id]);
    await pool.query(
      "INSERT INTO audit_logs (task_id, task_title, board_id, user_id, user_name, event_type, old_value, new_value) VALUES (?, ?, ?, ?, ?, 'COMMENT_EDITED', ?, ?)",
      [existing[0].task_id, taskInfo2[0]?.title, taskInfo2[0]?.board_id, req.user!.id, userInfo2[0] ? `${userInfo2[0].first_name} ${userInfo2[0].surname}` : null, existing[0].content.substring(0, 50), content.substring(0, 50)]
    );

    res.json({ message: "comment updated!" });
  } catch (error: any) {
    res.status(500).json({ message: "couldnt edit comment :(", error: error.message });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const [existing] = await pool.query<RowDataPacket[]>("SELECT content, user_id, task_id FROM comments WHERE id = ?", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: "comment not found :/" });
    if (existing[0].user_id !== req.user!.id) return res.status(403).json({ message: "not your comment! :(" });

    await pool.query("DELETE FROM comments WHERE id = ?", [req.params.id]);

    const [taskInfo3] = await pool.query<RowDataPacket[]>("SELECT title, board_id FROM tasks WHERE id = ?", [existing[0].task_id]);
    const [userInfo3] = await pool.query<RowDataPacket[]>("SELECT first_name, surname FROM users WHERE id = ?", [req.user!.id]);
    await pool.query(
      "INSERT INTO audit_logs (task_id, task_title, board_id, user_id, user_name, event_type, old_value) VALUES (?, ?, ?, ?, ?, 'COMMENT_DELETED', ?)",
      [existing[0].task_id, taskInfo3[0]?.title, taskInfo3[0]?.board_id, req.user!.id, userInfo3[0] ? `${userInfo3[0].first_name} ${userInfo3[0].surname}` : null, existing[0].content.substring(0, 50)]
    );

    res.json({ message: "comment deleted!" });
  } catch (error: any) {
    res.status(500).json({ message: "couldnt delete comment :(", error: error.message });
  }
};
