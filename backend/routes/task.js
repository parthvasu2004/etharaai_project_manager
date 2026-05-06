const express = require("express");
const router = express.Router();
const db = require("../models/db");
const auth = require("../middleware/authMiddleware");

const VALID_STATUSES = ["pending", "in-progress", "completed"];


// POST /tasks — only project creator can create a task
router.post("/", auth, (req, res) => {
  const { title, description, assigned_to, project_id } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Task title is required" });
  }

  if (!project_id) {
    return res.status(400).json({ error: "project_id is required" });
  }

  try {
    // Check project
    const project = db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(project_id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res.status(403).json({
        error: "Only the project creator can create tasks",
      });
    }

    const result = db
      .prepare(`
        INSERT INTO tasks (title, description, status, assigned_to, project_id)
        VALUES (?, ?, 'pending', ?, ?)
      `)
      .run(title, description || "", assigned_to || null, project_id);

    res.status(201).json({
      taskId: result.lastInsertRowid,
      title,
      status: "pending",
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /tasks — list tasks (optional filter by project)
router.get("/", auth, (req, res) => {
  const { project_id } = req.query;

  try {
    let query = `
      SELECT t.*, 
             u.username as assignee_name, 
             p.name as project_name, 
             p.created_by as project_creator_id
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id
    `;

    let tasks;

    if (project_id) {
      query += " WHERE t.project_id = ?";
      query += " ORDER BY t.created_at DESC";

      tasks = db.prepare(query).all(project_id);
    } else {
      query += " ORDER BY t.created_at DESC";

      tasks = db.prepare(query).all();
    }

    res.json(tasks);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PUT /tasks/:id — only assigned user can update status
router.put("/:id", auth, (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  try {
    const task = db
      .prepare("SELECT * FROM tasks WHERE id = ?")
      .get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.assigned_to !== req.user.id) {
      return res.status(403).json({
        error: "Only the assigned user can update task status",
      });
    }

    db.prepare("UPDATE tasks SET status = ? WHERE id = ?")
      .run(status, req.params.id);

    res.json({
      message: "Task updated",
      taskId: Number(req.params.id),
      status,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE /tasks/:id — only project creator can delete
router.delete("/:id", auth, (req, res) => {
  try {
    const task = db
      .prepare(`
        SELECT t.*, p.created_by as project_creator_id
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE t.id = ?
      `)
      .get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.project_creator_id !== req.user.id) {
      return res.status(403).json({
        error: "Only the project creator can delete tasks",
      });
    }

    db.prepare("DELETE FROM tasks WHERE id = ?")
      .run(req.params.id);

    res.json({ message: "Task deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;