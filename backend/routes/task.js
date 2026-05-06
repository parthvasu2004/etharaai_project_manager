const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const Project = require("../models/Project");

const VALID_STATUSES = ["pending", "in-progress", "completed"];

// POST /tasks — only project creator can create
router.post("/", auth, async (req, res) => {
  const { title, description, assigned_to, project_id } = req.body;

  if (!title) return res.status(400).json({ error: "Task title is required" });
  if (!project_id) return res.status(400).json({ error: "project_id is required" });

  try {
    const project = await Project.findById(project_id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Only the project creator can create tasks" });
    }

    const task = await Task.create({
      title,
      description: description || "",
      assigned_to: assigned_to || null,
      project_id,
    });

    res.status(201).json({ taskId: task._id, title: task.title, status: task.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tasks?project_id=X
router.get("/", auth, async (req, res) => {
  const { project_id } = req.query;

  try {
    const filter = project_id ? { project_id } : {};
    const tasks = await Task.find(filter)
      .populate("assigned_to", "username")
      .populate("project_id", "name created_by")
      .sort({ createdAt: -1 });

    res.json(
      tasks.map((t) => ({
        id: t._id,
        title: t.title,
        description: t.description,
        status: t.status,
        assigned_to: t.assigned_to?._id || null,
        assignee_name: t.assigned_to?.username || null,
        project_id: t.project_id?._id || null,
        project_name: t.project_id?.name || null,
        project_creator_id: t.project_id?.created_by || null,
        created_at: t.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /tasks/:id — only assigned user can update status
router.put("/:id", auth, async (req, res) => {
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "Status is required" });
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (!task.assigned_to || task.assigned_to.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Only the assigned user can update task status" });
    }

    task.status = status;
    await task.save();

    res.json({ message: "Task updated", taskId: task._id, status: task.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tasks/:id — only project creator can delete
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("project_id", "created_by");
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.project_id.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Only the project creator can delete tasks" });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;