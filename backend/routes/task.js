const express = require("express");
const router = express.Router();
const db = require("../models/db");
const auth = require("../middleware/authMiddleware");

const VALID_STATUSES = ["pending", "in-progress", "completed"];

// POST /tasks — create a task
router.post("/", auth, (req, res) => {
  const { title, description, assigned_to, project_id } = req.body;

  if (!title) return res.status(400).json({ error: "Task title is required" });
  if (!project_id) return res.status(400).json({ error: "project_id is required" });

  db.run(
    "INSERT INTO tasks (title, description, status, assigned_to, project_id) VALUES (?, ?, 'pending', ?, ?)",
    [title, description || "", assigned_to || null, project_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ taskId: this.lastID, title, status: "pending" });
    }
  );
});

// GET /tasks?project_id=X — list tasks, optionally filtered by project
router.get("/", auth, (req, res) => {
  const { project_id } = req.query;

  let query = `
    SELECT t.*, u.username as assignee_name, p.name as project_name
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

// PUT /tasks/:id — update task status
router.put("/:id", auth, (req, res) => {
  const { status, title, description, assigned_to } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
  }

  db.get("SELECT * FROM tasks WHERE id = ?", [req.params.id], (err, task) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const updatedTitle = title ?? task.title;
    const updatedDesc = description ?? task.description;
    const updatedStatus = status ?? task.status;
    const updatedAssignee = assigned_to !== undefined ? assigned_to : task.assigned_to;

    db.run(
      "UPDATE tasks SET title = ?, description = ?, status = ?, assigned_to = ? WHERE id = ?",
      [updatedTitle, updatedDesc, updatedStatus, updatedAssignee, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Task updated", taskId: Number(req.params.id), status: updatedStatus });
      }
    );
  });
});

// DELETE /tasks/:id
router.delete("/:id", auth, (req, res) => {
  db.get("SELECT * FROM tasks WHERE id = ?", [req.params.id], (err, task) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!task) return res.status(404).json({ error: "Task not found" });

    db.run("DELETE FROM tasks WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Task deleted" });
    });
  });
});

module.exports = router;