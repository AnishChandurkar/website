import { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";

// Get all workflows for all boards inside a specific project
export const getProjectWorkflows = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;

        // Join columns and boards to ensure we only get workflows belonging to this project
        const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT w.id, w.from_column_id, w.to_column_id, 
             c1.name as source_name, c2.name as target_name, w.board_id
      FROM allowed_workflows w
      JOIN columns c1 ON w.from_column_id = c1.id
      JOIN columns c2 ON w.to_column_id = c2.id
      JOIN boards b ON w.board_id = b.id
      WHERE b.project_id = ?
    `, [projectId]);

        const formatted = rows.map(r => ({
            id: r.id,
            board_id: r.board_id,
            from_column_id: r.from_column_id,
            to_column_id: r.to_column_id,
            source: r.source_name,
            target: r.target_name
        }));

        res.json(formatted);
    } catch (error: any) {
        res.status(500).json({ message: "failed to get workflows", error: error.message });
    }
};

export const addWorkflow = async (req: Request, res: Response) => {
    try {
        // When adding, we will expect the frontend to pass board_id and the two columns
        const { board_id, from_column_id, to_column_id } = req.body;

        if (!board_id || !from_column_id || !to_column_id) {
            return res.status(400).json({ message: "board_id, from_column_id and to_column_id required" });
        }

        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO allowed_workflows (board_id, from_column_id, to_column_id) VALUES (?, ?, ?)",
            [board_id, from_column_id, to_column_id]
        );

        res.status(201).json({ message: "workflow added", id: result.insertId });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "this workflow transition already exists :/" });
        }
        res.status(500).json({ message: "failed to add workflow", error: error.message });
    }
};

export const deleteWorkflow = async (req: Request, res: Response) => {
    try {
        const { workflowId } = req.params;
        await pool.query("DELETE FROM allowed_workflows WHERE id = ?", [workflowId]);
        res.json({ message: "workflow deleted!" });
    } catch (error: any) {
        res.status(500).json({ message: "failed to delete workflow", error: error.message });
    }
};
