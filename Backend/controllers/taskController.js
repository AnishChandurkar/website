const pool = require("../config/db");

const getTasks = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*,
                    ua.first_name AS assigned_first_name, ua.surname AS assigned_surname,
                    ur.first_name AS reporter_first_name, ur.surname AS reporter_surname,
                    p.title AS parent_title, p.type AS parent_type
             FROM tasks t
             LEFT JOIN users ua ON t.assigned_to = ua.id
             LEFT JOIN users ur ON t.reporter_id = ur.id
             LEFT JOIN tasks p  ON t.parent_id = p.id
             WHERE t.board_id = ?
             ORDER BY t.created_at DESC`,
      [req.params.boardId],
    );
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*,
                    ua.first_name AS assigned_first_name, ua.surname AS assigned_surname,
                    ur.first_name AS reporter_first_name, ur.surname AS reporter_surname,
                    p.title AS parent_title, p.type AS parent_type,
                    c.name AS column_name
             FROM tasks t
             LEFT JOIN users ua ON t.assigned_to = ua.id
             LEFT JOIN users ur ON t.reporter_id = ur.id
             LEFT JOIN tasks p  ON t.parent_id = p.id
             LEFT JOIN columns c ON t.column_id = c.id
             WHERE t.id = ?`,
      [req.params.id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "task not found :/" });
    res.json(rows[0]);
  } catch (error) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

const getChildTasks = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*,
                    ua.first_name AS assigned_first_name, ua.surname AS assigned_surname,
                    c.name AS column_name
             FROM tasks t
             LEFT JOIN users ua ON t.assigned_to = ua.id
             LEFT JOIN columns c ON t.column_id = c.id
             WHERE t.parent_id = ?
             ORDER BY t.created_at DESC`,
      [req.params.id],
    );
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
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
      const [parent] = await pool.query("SELECT type FROM tasks WHERE id = ?", [
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
      const [col] = await pool.query(
        "SELECT wip_limit FROM columns WHERE id = ?",
        [column_id],
      );
      if (col.length > 0 && col[0].wip_limit !== null) {
        const [count] = await pool.query(
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

    const [result] = await pool.query(
      "INSERT INTO tasks (title, description, type, board_id, column_id, priority, assigned_to, reporter_id, parent_id, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        description || null,
        type || "Task",
        req.params.boardId,
        column_id || null,
        priority || "MEDIUM",
        assigned_to || null,
        req.user.id,
        parent_id || null,
        due_date || null,
      ],
    );

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
  } catch (error) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

const moveTask = async (req, res) => {
  try {
    const { column_id } = req.body;
    const taskId = req.params.id;

    const [col] = await pool.query(
      "SELECT wip_limit, name FROM columns WHERE id = ?",
      [column_id],
    );
    if (col.length === 0) {
      return res.status(404).json({ message: "that column doesnt exist :/" });
    }

    if (col[0].wip_limit !== null) {
      const [count] = await pool.query(
        "SELECT COUNT(*) AS c FROM tasks WHERE column_id = ? AND id != ?",
        [column_id, taskId],
      );
      if (count[0].c >= col[0].wip_limit) {
        return res.status(400).json({
          message: `nope! "${col[0].name}" is at its limit of ${col[0].wip_limit} tasks`,
        });
      }
    }

    await pool.query("UPDATE tasks SET column_id = ? WHERE id = ?", [
      column_id,
      taskId,
    ]);
    res.json({ message: "task moved!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const {
      title,
      priority,
      assigned_to,
      description,
      type,
      due_date,
      parent_id,
    } = req.body;

    if (parent_id !== undefined && parent_id !== null) {
      const [parent] = await pool.query("SELECT type FROM tasks WHERE id = ?", [
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
    res.json({ message: "task updated!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    await pool.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    res.json({ message: "task deleted!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "something went wrong :(", error: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  getChildTasks,
  createTask,
  moveTask,
  updateTask,
  deleteTask,
};
