const express = require("express");
const router = express.Router();
const db = require("../models/db");
const auth = require("../middleware/authMiddleware");


// POST /projects — create a project
router.post("/", auth, (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Project name is required" });
  }

  try {
    const result = db
      .prepare("INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)")
      .run(name, description || "", req.user.id);

    res.status(201).json({
      projectId: result.lastInsertRowid,
      name,
      description,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /projects — list all projects
router.get("/", auth, (req, res) => {
  try {
    const projects = db
      .prepare(`
        SELECT p.*, u.username as creator_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
      `)
      .all();

    res.json(projects);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /projects/:id — single project
router.get("/:id", auth, (req, res) => {
  try {
    const project = db
      .prepare(`
        SELECT p.*, u.username as creator_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = ?
      `)
      .get(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE /projects/:id — only creator can delete
router.delete("/:id", auth, (req, res) => {
  try {
    const project = db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res.status(403).json({
        error: "Only the project creator can delete this project",
      });
    }

    db.prepare("DELETE FROM projects WHERE id = ?")
      .run(req.params.id);

    res.json({ message: "Project deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;