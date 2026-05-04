import { useState, useEffect } from "react";
import { createTask, getUsers } from "../api/auth";

export default function TaskForm({ projectId, onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    try {
      const task = await createTask({
        title: title.trim(),
        description: description.trim(),
        assigned_to: assignedTo || null,
        project_id: projectId,
      });
      onCreated(task);
      setTitle("");
      setDescription("");
      setAssignedTo("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-form">
      <div className="inline-form-title">＋ Add Task</div>
      {error && <div className="form-error">⚠ {error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Task Title</label>
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design landing page"
            autoFocus
            required
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select
              className="form-select"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !title.trim()}>
            {loading ? <span className="loading-spinner" /> : "Add Task"}
          </button>
        </div>
      </form>
    </div>
  );
}