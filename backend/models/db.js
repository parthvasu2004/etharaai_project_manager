const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/taskmanager.db");

// Connect DB
const db = new Database(dbPath);

console.log("Connected to SQLite database (better-sqlite3).");

// Enable foreign keys
db.prepare("PRAGMA foreign_keys = ON").run();

// Create tables
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to INTEGER,
    project_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  )
`).run();


// ----------------------
// AUTO MIGRATION (SYNC)
// ----------------------

// Projects table columns
const projectCols = db.prepare("PRAGMA table_info(projects)").all();
const projectNames = projectCols.map(c => c.name);

if (!projectNames.includes("description")) {
  db.prepare("ALTER TABLE projects ADD COLUMN description TEXT").run();
}
if (!projectNames.includes("created_at")) {
  db.prepare("ALTER TABLE projects ADD COLUMN created_at DATETIME").run();
}

// Tasks table columns
const taskCols = db.prepare("PRAGMA table_info(tasks)").all();
const taskNames = taskCols.map(c => c.name);

if (!taskNames.includes("description")) {
  db.prepare("ALTER TABLE tasks ADD COLUMN description TEXT").run();
}
if (!taskNames.includes("created_at")) {
  db.prepare("ALTER TABLE tasks ADD COLUMN created_at DATETIME").run();
}

module.exports = db;