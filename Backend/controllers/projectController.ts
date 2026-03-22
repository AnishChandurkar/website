import { Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";
import { AuthRequest } from "./authController";

// --- Types & Interfaces ---

interface ProjectRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  owner_id: number;
  created_at?: Date;
  updated_at?: Date;
}

interface BoardRow extends RowDataPacket {
  id: number;
  name: string;
  project_id: number;
  color: string;
  task_count?: number;
}

interface MemberRow extends RowDataPacket {
  id: number;
  first_name: string;
  surname: string;
  emailid: string;
  profile_url: string | null;
  role: string;
}

// --- Controllers ---

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [rows] = await pool.query<ProjectRow[]>(
      `SELECT p.*, 
       CASE WHEN usp.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_starred
       FROM projects p 
       JOIN project_members pm ON p.id = pm.project_id 
       LEFT JOIN user_starred_projects usp ON p.id = usp.project_id AND usp.user_id = ?
       LEFT JOIN user_archived_projects uap ON p.id = uap.project_id AND uap.user_id = ?
       WHERE pm.user_id = ? AND uap.user_id IS NULL`,
      [req.user.id, req.user.id, req.user.id],
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const [projects] = await pool.query<ProjectRow[]>(
      "SELECT * FROM projects WHERE id = ?",
      [req.params.id]
    );
    const project = projects[0];
    if (!project) {
      return res.status(404).json({ message: "project not found :(" });
    }

    const [boards] = await pool.query<BoardRow[]>(
      `SELECT b.*, (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id AND t.closed_at IS NULL) AS task_count
       FROM boards b WHERE b.project_id = ?`,
      [req.params.id]
    );

    const [members] = await pool.query<MemberRow[]>(
      `SELECT u.id, u.first_name, u.surname, u.emailid, u.profile_url, pm.role
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`,
      [req.params.id]
    );

    const currentUserRole = members.find(m => m.id === req.user?.id)?.role || null;

    res.json({
      ...project,
      boards,
      members,
      currentUserRole
    });
  } catch (error: any) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

export const getArchivedProjects = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [rows] = await pool.query<ProjectRow[]>(
      "SELECT p.* FROM projects p JOIN project_members pm ON p.id = pm.project_id JOIN user_archived_projects uap ON p.id = uap.project_id WHERE pm.user_id = ? AND uap.user_id = ?",
      [req.user.id, req.user.id],
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.emailid !== 'admin@workspace.com') {
      return res.status(403).json({ message: "only the global admin can create projects!" });
    }

    const { name, status, description } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO projects (name, description, status, owner_id) VALUES (?, ?, ?, ?)",
      [name, description || null, status || "Planning", req.user.id],
    );
    await pool.query(
      "INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)",
      [result.insertId, req.user.id, "Project Admin"],
    );

    res.status(201).json({
      message: "project created!!",
      project: {
        id: result.insertId,
        name,
        description,
        status: status || "Planning",
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, status, progress, description } = req.body;
    await pool.query(
      "UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), status = COALESCE(?, status), progress = COALESCE(?, progress), updated_at = NOW() WHERE id = ?",
      [name, description, status, progress, req.params.id],
    );
    res.json({ message: "project updated!!" });
  } catch (error: any) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

export const archiveProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { is_archived } = req.body;
    const projectId = req.params.id;
    const userId = req.user.id;

    if (is_archived) {
      await pool.query(
        "INSERT IGNORE INTO user_archived_projects (user_id, project_id) VALUES (?, ?)",
        [userId, projectId]
      );
    } else {
      await pool.query(
        "DELETE FROM user_archived_projects WHERE user_id = ? AND project_id = ?",
        [userId, projectId]
      );
    }
    res.json({
      message: is_archived ? "Project archived" : "Project restored",
    });
  } catch (error: any) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

export const toggleStar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { is_starred } = req.body;
    const projectId = req.params.id;
    const userId = req.user.id;

    if (is_starred) {
      // Insert into junction table (ignore if already exists)
      await pool.query(
        "INSERT IGNORE INTO user_starred_projects (user_id, project_id) VALUES (?, ?)",
        [userId, projectId]
      );
    } else {
      // Remove from junction table
      await pool.query(
        "DELETE FROM user_starred_projects WHERE user_id = ? AND project_id = ?",
        [userId, projectId]
      );
    }
    res.json({ message: is_starred ? "Project starred" : "Project unstarred" });
  } catch (error: any) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [projects] = await pool.query<ProjectRow[]>(
      "SELECT owner_id FROM projects WHERE id = ?",
      [req.params.id]
    );
    const project = projects[0];
    if (!project) {
      return res.status(404).json({ message: "project not found :(" });
    }
    if (req.user.emailid !== 'admin@workspace.com') {
      return res.status(403).json({ message: "only the global workspace admin can delete projects! project admins can only archive them :/" });
    }

    await pool.query("DELETE FROM projects WHERE id = ?", [req.params.id]);
    res.json({ message: "project deleted successfully!!" });
  } catch (error: any) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};
