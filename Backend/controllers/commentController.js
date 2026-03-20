const pool = require("../config/db");

const getComments = async (req, res) => {
  try {
    const [comments] = await pool.query(
      `SELECT c.*, u.first_name, u.surname 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.task_id = ? 
       ORDER BY c.created_at ASC`,
      [req.params.taskId]
    );
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "failed to fetch comments :(", error: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "comment cannot be empty :/" });

    const [result] = await pool.query(
      "INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)",
      [req.params.taskId, req.user.id, content]
    );

    await pool.query(
      "INSERT INTO audit_logs (task_id, user_id, event_type, new_value) VALUES (?, ?, 'COMMENT_ADDED', ?)",
      [req.params.taskId, req.user.id, content.substring(0, 50)]
    );

    res.status(201).json({ message: "comment added!" });
  } catch (error) {
    res.status(500).json({ message: "couldnt add comment :(", error: error.message });
  }
};

const editComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "comment cannot be empty :/" });

    const [existing] = await pool.query("SELECT content, user_id, task_id FROM comments WHERE id = ?", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: "comment not found :/" });
    if (existing[0].user_id !== req.user.id) return res.status(403).json({ message: "not your comment! :(" });

    await pool.query("UPDATE comments SET content = ? WHERE id = ?", [content, req.params.id]);

    await pool.query(
      "INSERT INTO audit_logs (task_id, user_id, event_type, old_value, new_value) VALUES (?, ?, 'COMMENT_EDITED', ?, ?)",
      [existing[0].task_id, req.user.id, existing[0].content.substring(0, 50), content.substring(0, 50)]
    );

    res.json({ message: "comment updated!" });
  } catch (error) {
    res.status(500).json({ message: "couldnt edit comment :(", error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const [existing] = await pool.query("SELECT content, user_id, task_id FROM comments WHERE id = ?", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: "comment not found :/" });
    if (existing[0].user_id !== req.user.id) return res.status(403).json({ message: "not your comment! :(" });

    await pool.query("DELETE FROM comments WHERE id = ?", [req.params.id]);

    await pool.query(
      "INSERT INTO audit_logs (task_id, user_id, event_type, old_value) VALUES (?, ?, 'COMMENT_DELETED', ?)",
      [existing[0].task_id, req.user.id, existing[0].content.substring(0, 50)]
    );

    res.json({ message: "comment deleted!" });
  } catch (error) {
    res.status(500).json({ message: "couldnt delete comment :(", error: error.message });
  }
};

module.exports = { getComments, addComment, editComment, deleteComment };
