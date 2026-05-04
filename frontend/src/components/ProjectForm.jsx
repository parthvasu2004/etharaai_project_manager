import { useState } from "react";
import { createProject } from "../api/auth";

export default function ProjectForm({ onCreated, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const project = await createProject(name.trim(), description.trim());
      onCreated(project);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-form">
      <div className="inline-form-title">＋ New Project</div>
      {error && <div className="form-error">⚠ {error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Project Name</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Website Redesign"
            autoFocus
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <input
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description..."
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !name.trim()}>
            {loading ? <span className="loading-spinner" /> : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}