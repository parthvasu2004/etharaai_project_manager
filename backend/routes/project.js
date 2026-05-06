const express = require("express");
const router = express.Router();
const db = require("../models/db");
const auth = require("../middleware/authMiddleware");

// POST /projects — create a project (any logged-in user)
router.post("/", auth, (req, res) => {
  const { name, description } = req.body;

  if (!name) return res.status(400).json({ error: "Project name is required" });

  db.run(
    "INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)",
    [name, description || "", req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ projectId: this.lastID, name, description });
    }
  );
});

// GET /projects — list all projects with creator info
router.get("/", auth, (req, res) => {
  db.all(
    `SELECT p.*, u.username as creator_name
     FROM projects p
     LEFT JOIN users u ON p.created_by = u.id
     ORDER BY p.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET /projects/:id — single project
router.get("/:id", auth, (req, res) => {
  db.get(
    `SELECT p.*, u.username as creator_name
     FROM projects p
     LEFT JOIN users u ON p.created_by = u.id
     WHERE p.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Project not found" });
      res.json(row);
    }
  );
});

// DELETE /projects/:id — only the project creator can delete
router.delete("/:id", auth, (req, res) => {
  db.get("SELECT * FROM projects WHERE id = ?", [req.params.id], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.created_by !== req.user.id) {
      return res.status(403).json({ error: "Only the project creator can delete this project" });
    }

    db.run("DELETE FROM projects WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Project deleted" });
    });
  });
});

module.exports = router;