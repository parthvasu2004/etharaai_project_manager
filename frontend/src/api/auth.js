const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// Auth
export async function signup(username, password) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function getUsers() {
  const res = await fetch(`${BASE}/auth/users`, { headers: authHeaders() });
  return handleResponse(res);
}

// Projects
export async function getProjects() {
  const res = await fetch(`${BASE}/projects`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createProject(name, description) {
  const res = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, description }),
  });
  return handleResponse(res);
}

export async function deleteProject(id) {
  const res = await fetch(`${BASE}/projects/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// Tasks
export async function getTasks(project_id) {
  const url = project_id
    ? `${BASE}/tasks?project_id=${project_id}`
    : `${BASE}/tasks`;
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createTask(data) {
  const res = await fetch(`${BASE}/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateTask(id, data) {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteTask(id) {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}