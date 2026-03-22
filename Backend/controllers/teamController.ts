import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../config/db";
import { AuthRequest } from "./authController";

// types & interfaces

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

interface RoleCheckRow extends RowDataPacket {
  global_role: string;
  project_role: string;
}

// controllers

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

// add a member to the project
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

// remove a member from the project
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

// update a member's role in the project
export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { role } = req.body;
    const validRoles = ['Project Admin', 'Project Member', 'Project Viewer'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'invalid role' });
    }

    if (!req.user) return res.status(401).json({ message: 'unauthorized' });

    // preventing users from messing with their own permissions
    if (req.user.id.toString() === req.params.userId) {
      return res.status(403).json({ message: 'you cannot change your own role :/' });
    }

    // pull whatever roles the person making the request has internally and globally
    const [requesterRows] = await pool.query<RoleCheckRow[]>(
      `SELECT u.global_role, pm.role as project_role 
       FROM users u 
       JOIN project_members pm ON pm.user_id = u.id 
       WHERE u.id = ? AND pm.project_id = ?`,
      [req.user.id, req.params.projectId]
    );

    // do the same thing for the person receiving the role change
    const [targetRows] = await pool.query<RoleCheckRow[]>(
      `SELECT u.global_role, pm.role as project_role 
       FROM users u 
       JOIN project_members pm ON pm.user_id = u.id 
       WHERE u.id = ? AND pm.project_id = ?`,
      [req.params.userId, req.params.projectId]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ message: 'user is not a member of this project :(' });
    }

    const requester = requesterRows[0];
    const target = targetRows[0];

    // global admins are completely untouchable by anyone
    if (target.global_role === 'Global Admin') {
      return res.status(403).json({ message: 'you cannot change the role of a global admin :/' });
    }
    
    // a regular project admin is not allowed to change the role of another project admin
    // they can only be changed by global admins 
    if (target.project_role === 'Project Admin' && requester.global_role !== 'Global Admin') {
      return res.status(403).json({ message: 'project admins cannot change the role of other project admins :/' });
    }

    // all checks passed, fire off the update query
    await pool.query(
      'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
      [role, req.params.projectId, req.params.userId]
    );

    res.json({ message: 'role updated!!' });
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};

// fetch all unique teammates across all projects for the user
export const getMyTeammates = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return res.status(401).json({ message: "unauthorized" });

    const [rows] = await pool.query<MemberRow[]>(
      `SELECT DISTINCT u.id, u.first_name, u.surname, u.emailid, u.profile_url
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id IN (
         SELECT project_id FROM project_members WHERE user_id = ?
       ) AND u.id != ?`,
      [req.user.id, req.user.id]
    );

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'something went wrong :(', error: error.message });
  }
};
