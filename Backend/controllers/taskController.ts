import { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";
import { internalCreateNotification } from "./notificationController";

export interface AuthRequest extends Request {
  user?: any;
}

export const getTasks = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.*,
                    ua.first_name AS assigned_first_name, ua.surname AS assigned_surname,
                    ur.first_name AS reporter_first_name, ur.surname AS reporter_surname,
                    p.title AS parent_title, p.type AS parent_type,
                    COALESCE(t.column_name, 'Unplaced') AS column_name
             FROM tasks t
             LEFT JOIN users ua ON t.assigned_to = ua.id
             LEFT JOIN users ur ON t.reporter_id = ur.id
             LEFT JOIN tasks p  ON t.parent_id = p.id
             WHERE t.board_id = ? AND t.closed_at IS NULL
             ORDER BY t.created_at DESC`,
      [req.params.boardId],
    );
    res.json(rows);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

export const reSyncStories = async (req: AuthRequest, res: Response): Promise<any> => {
  const boardId = req.params.boardId as string;
  try {
    const [stories] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM tasks WHERE board_id = ? AND type = 'Story'",
      [boardId]
    );

    for (const story of stories) {
      await updateParentStoryStatus(story.id, boardId);
    }

    res.json({ message: "All stories re-synced successfully!" });
  } catch (error: any) {
    res.status(500).json({ message: "re-sync failed", error: error.message });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.*,
                    ua.first_name AS assigned_first_name, ua.surname AS assigned_surname,
                    ur.first_name AS reporter_first_name, ur.surname AS reporter_surname,
                    p.title AS parent_title, p.type AS parent_type,
                    COALESCE(t.column_name, 'Unplaced') AS column_name,
                    COALESCE(p.column_name, 'Unplaced') AS parent_column_name
             FROM tasks t
             LEFT JOIN users ua ON t.assigned_to = ua.id
             LEFT JOIN users ur ON t.reporter_id = ur.id
             LEFT JOIN tasks p  ON t.parent_id = p.id
             WHERE t.id = ?`,
      [req.params.id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "task not found :/" });
    res.json(rows[0]);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

export const getChildTasks = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.*,
                    ua.first_name AS assigned_first_name, ua.surname AS assigned_surname,
                    COALESCE(t.column_name, 'Unplaced') AS column_name
             FROM tasks t
             LEFT JOIN users ua ON t.assigned_to = ua.id
             WHERE t.parent_id = ?
             ORDER BY t.created_at DESC`,
      [req.params.id],
    );
    res.json(rows);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const {
      title,
      column_id,
      priority,
      assigned_to,
      type,
      description,
      parent_id,
      due_date,
    } = req.body;

    if (parent_id) {
      const [parent] = await pool.query<RowDataPacket[]>("SELECT type FROM tasks WHERE id = ?", [
        parent_id,
      ]);
      if (parent.length === 0)
        return res.status(404).json({ message: "parent story not found :/" });
      if (parent[0].type !== "Story")
        return res
          .status(400)
          .json({ message: "parent must be a Story type task" });
    }

    if (type === "Story" && parent_id) {
      return res
        .status(400)
        .json({ message: "Stories cannot have a parent story" });
    }

    if (column_id) {
      const [col] = await pool.query<RowDataPacket[]>(
        "SELECT wip_limit FROM columns WHERE id = ?",
        [column_id],
      );
      if (col.length > 0 && col[0].wip_limit !== null) {
        const [count] = await pool.query<RowDataPacket[]>(
          "SELECT COUNT(*) AS c FROM tasks WHERE column_id = ?",
          [column_id],
        );
        if (count[0].c >= col[0].wip_limit) {
          return res.status(400).json({
            message:
              "this column is full! move some tasks out before adding new ones",
          });
        }
      }
    }

    const [targetCol] = await pool.query<RowDataPacket[]>("SELECT name, position FROM columns WHERE id = ?", [column_id]);
    const [maxCol] = await pool.query<RowDataPacket[]>("SELECT MAX(position) AS max_pos FROM columns WHERE board_id = ?", [req.params.boardId]);

    const colName = targetCol.length > 0 ? targetCol[0].name : "Unplaced";

    let resolved_at = null;
    if (targetCol.length > 0 && maxCol.length > 0 && targetCol[0].position === maxCol[0].max_pos) {
      resolved_at = new Date();
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO tasks (title, description, type, board_id, column_id, column_name, priority, assigned_to, reporter_id, parent_id, due_date, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        description || null,
        type || "Task",
        req.params.boardId,
        column_id || null,
        colName,
        priority || "MEDIUM",
        assigned_to || null,
        req.user!.id,
        parent_id || null,
        due_date || null,
        resolved_at,
      ],
    );

    const taskId = result.insertId;

    await pool.query(
      "INSERT INTO audit_logs (task_id, user_id, event_type, new_value) VALUES (?, ?, 'TASK_CREATED', ?)",
      [taskId, req.user!.id, title]
    );

    if (parent_id) {
      await updateParentStoryStatus(parent_id, req.params.boardId as string);
    }

    if (assigned_to && assigned_to !== req.user!.id) {
      await internalCreateNotification(
        assigned_to,
        'TASK_ASSIGNED',
        `You have been assigned to a new task: ${title}`
      );
    }

    res.status(201).json({
      message: "task created!",
      task: {
        id: result.insertId,
        title,
        column_id,
        priority: priority || "MEDIUM",
        type: type || "Task",
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

export const moveTask = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { column_id } = req.body;
    const taskId = req.params.id;

    const [task] = await pool.query<RowDataPacket[]>(
      `SELECT t.title, t.assigned_to, t.column_id AS old_col, t.board_id, t.type, t.parent_id, c1.position AS old_pos, c1.name AS old_name 
       FROM tasks t 
       LEFT JOIN columns c1 ON t.column_id = c1.id 
       WHERE t.id = ?`,
      [taskId],
    );
    if (task.length === 0)
      return res.status(404).json({ message: "task not found :/" });

    if (task[0].type === "Story") {
      return res.status(400).json({ message: "Stories cannot be directly moved across workflow columns!" });
    }

    const { title, assigned_to, old_col, board_id, old_pos, old_name, parent_id } = task[0];

    const [col] = await pool.query<RowDataPacket[]>(
      "SELECT wip_limit, name, position FROM columns WHERE id = ? AND board_id = ?",
      [column_id, board_id],
    );
    if (col.length === 0) {
      return res.status(404).json({ message: "that column doesnt exist :/" });
    }

    const new_name = col[0].name;
    const new_pos = col[0].position;

    if (old_pos !== null && Math.abs(new_pos - old_pos) > 1) {
      const [allowed] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM allowed_workflows WHERE from_column_id = ? AND to_column_id = ?",
        [old_col, column_id]
      );
      if (allowed.length === 0) {
        return res
          .status(400)
          .json({ message: "whoa there! you cant skip stages or move backwards in the workflow!" });
      }
    }

    if (col[0].wip_limit !== null) {
      const [count] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS c FROM tasks WHERE column_id = ? AND id != ?",
        [column_id, taskId],
      );
      if (count[0].c >= col[0].wip_limit) {
        return res.status(400).json({
          message: `nope! "${col[0].name}" is at its limit of ${col[0].wip_limit} tasks`,
        });
      }
    }

    const [maxCol] = await pool.query<RowDataPacket[]>(
      "SELECT MAX(position) AS max_pos FROM columns WHERE board_id = ?",
      [board_id],
    );
    let extraUpdate = "";
    if (maxCol.length > 0 && new_pos === maxCol[0].max_pos) {
      extraUpdate = ", resolved_at = IFNULL(resolved_at, CURRENT_TIMESTAMP)";
    } else {
      extraUpdate = ", resolved_at = NULL";
    }

    await pool.query(
      `UPDATE tasks SET column_id = ?, column_name = ? ${extraUpdate} WHERE id = ?`,
      [column_id, new_name, taskId],
    );

    if (old_col !== column_id) {
      await pool.query(
        "INSERT INTO audit_logs (task_id, user_id, event_type, old_value, new_value) VALUES (?, ?, 'STATUS_CHANGE', ?, ?)",
        [taskId, req.user!.id, old_name || "Unplaced", new_name],
      );
    }

    if (parent_id) {
      await updateParentStoryStatus(parent_id, board_id);
    }

    if (assigned_to && assigned_to !== req.user!.id) {
      await internalCreateNotification(
        assigned_to,
        'STATUS_CHANGED',
        `Task "${title}" status changed from "${old_name || 'Unplaced'}" to "${new_name}"`
      );
    }

    res.json({ message: "task moved!" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const {
      title,
      priority,
      assigned_to,
      description,
      type,
      due_date,
      parent_id,
    } = req.body;

    const [oldRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tasks WHERE id = ?",
      [req.params.id],
    );
    if (oldRows.length === 0)
      return res.status(404).json({ message: "task not found :/" });
    const oldTask = oldRows[0];
    const old_assignee = oldTask.assigned_to;

    if (assigned_to !== undefined && assigned_to !== old_assignee) {
      await pool.query(
        "INSERT INTO audit_logs (task_id, user_id, event_type, old_value, new_value) VALUES (?, ?, 'ASSIGNEE_CHANGE', ?, ?)",
        [req.params.id, req.user!.id, old_assignee ? String(old_assignee) : "Unassigned", assigned_to ? String(assigned_to) : "Unassigned"]
      );
    }

    if (title !== undefined && title !== oldTask.title) {
      await pool.query(
        "INSERT INTO audit_logs (task_id, user_id, event_type, old_value, new_value) VALUES (?, ?, 'TASK_UPDATED', ?, ?)",
        [req.params.id, req.user!.id, oldTask.title, title]
      );
    }
    if (priority !== undefined && priority !== oldTask.priority) {
      await pool.query(
        "INSERT INTO audit_logs (task_id, user_id, event_type, old_value, new_value) VALUES (?, ?, 'TASK_UPDATED', ?, ?)",
        [req.params.id, req.user!.id, oldTask.priority, priority]
      );
    }

    if (parent_id !== undefined && parent_id !== null) {
      const [parent] = await pool.query<RowDataPacket[]>("SELECT type FROM tasks WHERE id = ?", [
        parent_id,
      ]);
      if (parent.length === 0)
        return res.status(404).json({ message: "parent story not found :/" });
      if (parent[0].type !== "Story")
        return res
          .status(400)
          .json({ message: "parent must be a Story type task" });
    }
    if (type === "Story" && parent_id) {
      return res
        .status(400)
        .json({ message: "Stories cannot have a parent story" });
    }

    const sets = [];
    const values = [];

    if (title !== undefined) {
      sets.push("title = ?");
      values.push(title || null);
    }
    if (description !== undefined) {
      sets.push("description = ?");
      values.push(description || null);
    }
    if (type !== undefined) {
      sets.push("type = ?");
      values.push(type);
    }
    if (priority !== undefined) {
      sets.push("priority = ?");
      values.push(priority);
    }
    if ("assigned_to" in req.body) {
      sets.push("assigned_to = ?");
      values.push(assigned_to || null);
    }
    if ("due_date" in req.body) {
      sets.push("due_date = ?");
      values.push(due_date || null);
    }
    if ("parent_id" in req.body) {
      sets.push("parent_id = ?");
      values.push(parent_id || null);
    }

    if (sets.length === 0)
      return res.status(400).json({ message: "no fields to update" });

    values.push(req.params.id);
    await pool.query(
      `UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`,
      values,
    );

    if ("parent_id" in req.body && String(req.body.parent_id) !== String(oldTask.parent_id)) {
      if (oldTask.parent_id) {
        await updateParentStoryStatus(oldTask.parent_id, oldTask.board_id);
      }
      if (parent_id) {
        await updateParentStoryStatus(parent_id, oldTask.board_id);
      }
    } else if (parent_id) {
      await updateParentStoryStatus(parent_id, oldTask.board_id);
    }

    if (assigned_to && assigned_to !== old_assignee && assigned_to !== req.user!.id) {
      await internalCreateNotification(
        assigned_to,
        'TASK_ASSIGNED',
        `You have been assigned to task: ${oldTask.title}`
      );
    }

    res.json({ message: "task updated!" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const [task] = await pool.query<RowDataPacket[]>("SELECT parent_id, board_id FROM tasks WHERE id = ?", [req.params.id]);

    await pool.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);

    if (task.length > 0 && task[0].parent_id) {
      await updateParentStoryStatus(task[0].parent_id, task[0].board_id);
    }

    res.json({ message: "task deleted!" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

const updateParentStoryStatus = async (parentId: string | number, boardId: string | number) => {
  if (!parentId) return;

  const [children] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.name, c.position 
         FROM tasks t 
         LEFT JOIN columns c ON t.column_id = c.id 
         WHERE t.parent_id = ? AND c.id IS NOT NULL`,
    [parentId]
  );

  if (children.length === 0) {
    await pool.query(`UPDATE tasks SET column_id = NULL, column_name = NULL, resolved_at = NULL WHERE id = ?`, [parentId]);
    return;
  }

  let minCol = children[0];
  for (const child of children) {
    if (child.position < minCol.position) {
      minCol = child;
    }
  }

  const [maxCol] = await pool.query<RowDataPacket[]>("SELECT MAX(position) AS max_pos FROM columns WHERE board_id = ?", [boardId]);
  let extraUpdate = ", resolved_at = NULL";
  if (maxCol.length > 0 && minCol.position === maxCol[0].max_pos) {
    extraUpdate = ", resolved_at = IFNULL(resolved_at, CURRENT_TIMESTAMP)";
  }

  await pool.query(`UPDATE tasks SET column_id = ?, column_name = ? ${extraUpdate} WHERE id = ?`, [minCol.id, minCol.name, parentId]);
};


export const closeTask = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const taskId = req.params.id;

    const [task] = await pool.query<RowDataPacket[]>(
      `SELECT t.id, t.board_id, c.position, (SELECT MAX(position) FROM columns WHERE board_id = t.board_id) as max_pos
       FROM tasks t
       JOIN columns c ON t.column_id = c.id
       WHERE t.id = ?`,
      [taskId]
    );

    if (task.length === 0) return res.status(404).json({ message: "Task not found" });

    if (task[0].position !== task[0].max_pos) {
      return res.status(400).json({ message: "Only tasks in the final status progress can be closed!" });
    }

    await pool.query(
      "UPDATE tasks SET closed_at = CURRENT_TIMESTAMP WHERE id = ?",
      [taskId]
    );

    await pool.query(
      "INSERT INTO audit_logs (task_id, user_id, event_type) VALUES (?, ?, 'TASK_CLOSED')",
      [taskId, req.user.id]
    );

    res.json({ message: "Task closed successfully!" });
  } catch (error: any) {
    console.error("CLOSE TASK ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to close task :(", error: error.message });
  }
};
