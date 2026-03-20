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
  is_archived: boolean;
  is_starred: boolean;
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
      "SELECT p.* FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = ? AND p.is_archived = FALSE",
      [req.user.id],
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
      `SELECT b.*, (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id) AS task_count
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

    res.json({
      ...project,
      boards,
      members
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
      "SELECT p.* FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = ? AND p.is_archived = TRUE",
      [req.user.id],
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
    const { is_archived } = req.body;
    await pool.query("UPDATE projects SET is_archived = ? WHERE id = ?", [
      is_archived,
      req.params.id,
    ]);
    res.json({
      message: is_archived ? "Project archived" : "Project restored",
    });
  } catch (error: any) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

export const toggleStar = async (req: AuthRequest, res: Response) => {
  try {
    const { is_starred } = req.body;
    await pool.query("UPDATE projects SET is_starred = ? WHERE id = ?", [
      is_starred,
      req.params.id,
    ]);
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
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ message: "only the project owner can delete this project :/" });
    }

    await pool.query("DELETE FROM projects WHERE id = ?", [req.params.id]);
    res.json({ message: "project deleted successfully!!" });
  } catch (error: any) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};
