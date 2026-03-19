const pool = require("../config/db");

const getProjects = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.* FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = ? AND p.is_archived = FALSE",
      [req.user.id],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const [projects] = await pool.query(
      "SELECT * FROM projects WHERE id = ?",
      [req.params.id]
    );
    if (projects.length === 0) {
      return res.status(404).json({ message: "project not found :(" });
    }

    const [boards] = await pool.query(
      `SELECT b.*, (SELECT COUNT(*) FROM tasks t WHERE t.board_id = b.id) AS task_count
       FROM boards b WHERE b.project_id = ?`,
      [req.params.id]
    );

    const [members] = await pool.query(
      `SELECT u.id, u.first_name, u.surname, u.emailid, u.profile_url, pm.role
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`,
      [req.params.id]
    );

    res.json({
      ...projects[0],
      boards,
      members
    });
  } catch (error) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

const getArchivedProjects = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.* FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = ? AND p.is_archived = TRUE",
      [req.user.id],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, status, description } = req.body;
    const [result] = await pool.query(
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
  } catch (error) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { name, status, progress, description } = req.body;
    await pool.query(
      "UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), status = COALESCE(?, status), progress = COALESCE(?, progress), updated_at = NOW() WHERE id = ?",
      [name, description, status, progress, req.params.id],
    );
    res.json({ message: "project updated!!" });
  } catch (error) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

const archiveProject = async (req, res) => {
  try {
    const { is_archived } = req.body;
    await pool.query("UPDATE projects SET is_archived = ? WHERE id = ?", [
      is_archived,
      req.params.id,
    ]);
    res.json({
      message: is_archived ? "Project archived" : "Project restored",
    });
  } catch (error) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

const toggleStar = async (req, res) => {
  try {
    const { is_starred } = req.body;
    await pool.query("UPDATE projects SET is_starred = ? WHERE id = ?", [
      is_starred,
      req.params.id,
    ]);
    res.json({ message: is_starred ? "Project starred" : "Project unstarred" });
  } catch (error) {
    res.status(500).json({ message: "something went wrong :(", error: error.message });
  }
};

const deleteProject = async (req, res) => {
    try {
        const [project] = await pool.query(
            "SELECT owner_id FROM projects WHERE id = ?",
            [req.params.id]
        );
        if (project.length === 0) {
            return res.status(404).json({ message: "project not found :(" });
        }
        if (project[0].owner_id !== req.user.id) {
            return res.status(403).json({ message: "only the project owner can delete this project :/" });
        }

        await pool.query("DELETE FROM projects WHERE id = ?", [req.params.id]);
        res.json({ message: "project deleted successfully!!" });
    } catch (error) {
        res.status(500).json({ message: "something went wrong :(", error: error.message });
    }
};

module.exports = {
  getProjects,
  getProjectById,
  getArchivedProjects,
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
  toggleStar,
};
