import { useState } from "react";
import { updateTask, deleteTask } from "../api/auth";

const STATUS_OPTIONS = ["pending", "in-progress", "completed"];

export default function TaskList({ tasks, currentUserId, isProjectCreator, onUpdate, onDelete }) {
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const filtered =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  async function handleStatusChange(task, newStatus) {
    if (task.status === newStatus) return;
    setUpdatingId(task.id);
    try {
      await updateTask(task.id, { status: newStatus });
      onUpdate(task.id, { ...task, status: newStatus });
    } catch (err) {
      alert("Failed to update: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      onDelete(id);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  }

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div>
      <div className="task-controls">
        <div className="task-filter-tabs">
          {["all", "pending", "in-progress", "completed"].map((s) => (
            <button
              key={s}
              className={`filter-tab ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "All" : s.replace("-", " ")}
              <span style={{ marginLeft: "0.3rem", opacity: 0.6 }}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="task-empty">
          <div className="task-empty-icon">✓</div>
          <div>
            {filter === "all"
              ? "No tasks yet. Add one above."
              : `No ${filter.replace("-", " ")} tasks.`}
          </div>
        </div>
      ) : (
        <div className="task-list">
          {filtered.map((task, i) => {
            const isAssignee = task.assigned_to === currentUserId;

            return (
              <div
                className="task-card"
                key={task.id}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="task-card-main">
                  <div className="task-title">{task.title}</div>
                  {task.description && (
                    <div className="task-description">{task.description}</div>
                  )}
                  <div className="task-meta">
                    {task.assignee_name && (
                      <span className="task-meta-item">
                        👤 {task.assignee_name}
                      </span>
                    )}
                    {task.project_name && (
                      <span className="task-meta-item">
                        📁 {task.project_name}
                      </span>
                    )}
                    {task.created_at && (
                      <span className="task-meta-item">
                        🕐{" "}
                        {new Date(task.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="task-card-right">
                  {/* Status dropdown: only visible to the assigned user */}
                  {isAssignee ? (
                    <select
                      className="status-select"
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value)}
                      disabled={updatingId === task.id}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("-", " ")}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`status-badge status-${task.status}`}>
                      {task.status.replace("-", " ")}
                    </span>
                  )}

                  {/* Delete button: only visible to project creator */}
                  {isProjectCreator && (
                    <div className="task-actions">
                      <button
                        className="icon-btn danger"
                        onClick={() => handleDelete(task.id)}
                        title="Delete task"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}