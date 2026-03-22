import { Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../config/db";
import { AuthRequest } from "../controllers/authController";

// types & interfaces

interface RoleRow extends RowDataPacket {
  role: string;
}

export interface ProjectRoleRequest extends AuthRequest {
  projectRole?: string;
}

// middleware

// check if user has required project role
const projectRole = (...allowedRoles: string[]) => {
  return async (req: ProjectRoleRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const projectId = req.params.projectId || req.params.id;

      if (!projectId) {
        return res.status(400).json({ message: 'project id is required :(' });
      }

      const [rows] = await pool.query<RoleRow[]>(
        'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, req.user.id]
      );

      const row = rows[0];
      if (!row) {
        return res.status(403).json({ message: 'you are not a member of this project :/' });
      }

      const userRole = row.role;

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`
        });
      }

      req.projectRole = userRole;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  };
};

export default projectRole;
