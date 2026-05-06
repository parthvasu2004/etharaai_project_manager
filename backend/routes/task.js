const express = require("express");
const router = express.Router();
const db = require("../models/db");
const auth = require("../middleware/authMiddleware");

const VALID_STATUSES = ["pending", "in-progress", "completed"];

// POST /tasks — only project creator can create a task
router.post("/", auth, (req, res) => {
  const { title, description, assigned_to, project_id } = req.body;

  if (!title) return res.status(400).json({ error: "Task title is required" });
  if (!project_id) return res.status(400).json({ error: "project_id is required" });

  // Verify the requesting user is the project creator
  db.get("SELECT * FROM projects WHERE id = ?", [project_id], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.created_by !== req.user.id) {
      return res.status(403).json({ error: "Only the project creator can create tasks" });
    }

    db.run(
      "INSERT INTO tasks (title, description, status, assigned_to, project_id) VALUES (?, ?, 'pending', ?, ?)",
      [title, description || "", assigned_to || null, project_id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ taskId: this.lastID, title, status: "pending" });
      }
    );
  });
});

// GET /tasks?project_id=X — list tasks, optionally filtered by project
router.get("/", auth, (req, res) => {
  const { project_id } = req.query;

  let query = `
    SELECT t.*, u.username as assignee_name, p.name as project_name, p.created_by as project_creator_id
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN projects p ON t.project_id = p.id
  `;
  const params = [];

  if (project_id) {
    query += " WHERE t.project_id = ?";
    params.push(project_id);
  }

  query += " ORDER BY t.created_at DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// PUT /tasks/:id — only the assigned user can update status (status only, nothing else)
router.put("/:id", auth, (req, res) => {
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "Status is required" });
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
  }

  db.get("SELECT * FROM tasks WHERE id = ?", [req.params.id], (err, task) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Only the assigned user can update status
    if (task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: "Only the assigned user can update task status" });
    }

    db.run(
      "UPDATE tasks SET status = ? WHERE id = ?",
      [status, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Task updated", taskId: Number(req.params.id), status });
      }
    );
  });
});

// DELETE /tasks/:id — only the project creator can delete a task
router.delete("/:id", auth, (req, res) => {
  db.get(
    `SELECT t.*, p.created_by as project_creator_id
     FROM tasks t
     JOIN projects p ON t.project_id = p.id
     WHERE t.id = ?`,
    [req.params.id],
    (err, task) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!task) return res.status(404).json({ error: "Task not found" });

      if (task.project_creator_id !== req.user.id) {
        return res.status(403).json({ error: "Only the project creator can delete tasks" });
      }

      db.run("DELETE FROM tasks WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Task deleted" });
      });
    }
  );
});

module.exports = router;