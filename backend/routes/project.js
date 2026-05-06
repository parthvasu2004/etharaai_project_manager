const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Project = require("../models/Project");

// POST /projects
router.post("/", auth, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Project name is required" });

  try {
    const project = await Project.create({
      name,
      description: description || "",
      created_by: req.user.id,
    });
    res.status(201).json({ projectId: project._id, name: project.name, description: project.description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /projects
router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("created_by", "username")
      .sort({ createdAt: -1 });

    res.json(
      projects.map((p) => ({
        id: p._id,
        name: p.name,
        description: p.description,
        created_by: p.created_by._id,
        creator_name: p.created_by.username,
        created_at: p.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /projects/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("created_by", "username");
    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json({
      id: project._id,
      name: project.name,
      description: project.description,
      created_by: project.created_by._id,
      creator_name: project.created_by.username,
      created_at: project.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /projects/:id — only creator
router.delete("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Only the project creator can delete this project" });
    }

    await project.deleteOne();
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;