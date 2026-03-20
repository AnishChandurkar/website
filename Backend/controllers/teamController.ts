import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../config/db";
import { AuthRequest } from "./authController";

// --- Types & Interfaces ---

interface MemberRow extends RowDataPacket {
  id: number;
  first_name: string;
  surname: string;
  emailid: string;
  profile_url: string | null;
  role: string;
}

interface UserIdRow extends RowDataPacket {
  id: number;
}

interface MysqlError extends Error {
  code?: string;
}

// --- Controllers ---

export const getMembers = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<MemberRow[]>(
      `SELECT u.id, u.first_name, u.surname, u.emailid, u.profile_url, pm.role
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`,
      [req.params.projectId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { emailid, role } = req.body;
    const validRoles = ['Project Admin', 'Project Member', 'Project Viewer'];
    const assignedRole = validRoles.includes(role) ? role : 'Project Member';

    const [users] = await pool.query<UserIdRow[]>('SELECT id FROM users WHERE emailid = ?', [emailid]);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ message: 'user not found with that email :(' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'you are already a member of this project :/' });
    }

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.projectId, user.id, assignedRole]
    );

    res.status(201).json({ message: 'member added!!', role: assignedRole });
  } catch (error: unknown) {
    const err = error as MysqlError;
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'user is already a member of this project :/' });
    }
    res.status(500).json({ message: 'something went wrong :(', error: err.message });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [req.params.projectId, req.params.userId]
    );
    res.json({ message: 'member removed!!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};
