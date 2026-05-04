import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import ProjectForm from "../components/ProjectForm";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import { getProjects, deleteProject, getTasks } from "../api/auth";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Load projects on mount
  useEffect(() => {
    getProjects()
      .then((data) => {
        setProjects(data);
        if (data.length > 0) setSelectedProject(data[0]);
      })
      .catch(console.error)
      .finally(() => setLoadingProjects(false));
  }, []);

  // Load tasks when project changes
  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      return;
    }
    setLoadingTasks(true);
    getTasks(selectedProject.id)
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoadingTasks(false));
  }, [selectedProject]);

  function handleProjectCreated(project) {
    // Re-fetch projects to get full data with creator info
    getProjects().then((data) => {
      setProjects(data);
      const newP = data.find((p) => p.id === project.projectId) || data[0];
      if (newP) setSelectedProject(newP);
    });
    setShowProjectForm(false);
  }

  async function handleDeleteProject(project) {
    if (!confirm(`Delete project "${project.name}"? All its tasks will remain.`)) return;
    try {
      await deleteProject(project.id);
      const updated = projects.filter((p) => p.id !== project.id);
      setProjects(updated);
      if (selectedProject?.id === project.id) {
        setSelectedProject(updated[0] || null);
      }
    } catch (err) {
      alert("Failed: " + err.message);
    }
  }

  function handleTaskCreated(task) {
    // Re-fetch to get full task with join data
    if (selectedProject) {
      getTasks(selectedProject.id).then(setTasks).catch(console.error);
    }
    setShowTaskForm(false);
  }

  function handleTaskUpdate(id, updatedTask) {
    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
  }

  function handleTaskDelete(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;

  return (
    <div className="app-layout">
      <Navbar />

      <div className="page-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-greeting">Dashboard</div>
          <h1 className="dashboard-title">
            Hey, <span>{user.username || "there"}</span> 👋
          </h1>
        </div>

        {/* Stats */}
        {selectedProject && (
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Total Tasks</span>
              <span className="stat-value blue">{totalTasks}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">In Progress</span>
              <span className="stat-value amber">{inProgressTasks}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Completed</span>
              <span className="stat-value green">{completedTasks}</span>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* LEFT: Projects */}
          <div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <div
                    className="panel-title-icon"
                    style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                  >
                    📁
                  </div>
                  Projects
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-body)",
                      fontWeight: 400,
                    }}
                  >
                    ({projects.length})
                  </span>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowProjectForm((v) => !v);
                    setShowTaskForm(false);
                  }}
                >
                  {showProjectForm ? "✕" : "＋ New"}
                </button>
              </div>

              <div className="panel-body" style={{ padding: "1rem" }}>
                {showProjectForm && (
                  <ProjectForm
                    onCreated={handleProjectCreated}
                    onCancel={() => setShowProjectForm(false)}
                  />
                )}

                {loadingProjects ? (
                  <div className="page-loading">
                    <span className="loading-spinner" /> Loading...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="project-empty">
                    <div className="project-empty-icon">📂</div>
                    <div>No projects yet. Create your first one!</div>
                  </div>
                ) : (
                  <div className="project-list">
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        className={`project-item ${selectedProject?.id === p.id ? "active" : ""}`}
                        onClick={() => {
                          setSelectedProject(p);
                          setShowTaskForm(false);
                        }}
                      >
                        <div className="project-item-info">
                          <div className="project-item-name">{p.name}</div>
                          <div className="project-item-meta">
                            by {p.creator_name || "unknown"}
                          </div>
                        </div>
                        <div className="project-item-actions">
                          {(user.role === "admin" || p.created_by === user.id) && (
                            <button
                              className="icon-btn danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(p);
                              }}
                              title="Delete project"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Tasks */}
          <div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <div
                    className="panel-title-icon"
                    style={{ background: "var(--blue-dim)", color: "var(--blue)" }}
                  >
                    ✓
                  </div>
                  {selectedProject ? selectedProject.name : "Tasks"}
                </div>
                {selectedProject && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setShowTaskForm((v) => !v);
                    }}
                  >
                    {showTaskForm ? "✕" : "＋ Add Task"}
                  </button>
                )}
              </div>

              <div className="panel-body">
                {!selectedProject ? (
                  <div className="no-project-selected">
                    <div className="no-project-icon">📋</div>
                    <div className="no-project-text">No project selected</div>
                    <div className="no-project-subtext">
                      Select a project from the left, or create a new one.
                    </div>
                  </div>
                ) : (
                  <>
                    {showTaskForm && (
                      <TaskForm
                        projectId={selectedProject.id}
                        onCreated={handleTaskCreated}
                        onCancel={() => setShowTaskForm(false)}
                      />
                    )}

                    {loadingTasks ? (
                      <div className="page-loading">
                        <span className="loading-spinner" /> Loading tasks...
                      </div>
                    ) : (
                      <TaskList
                        tasks={tasks}
                        onUpdate={handleTaskUpdate}
                        onDelete={handleTaskDelete}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}