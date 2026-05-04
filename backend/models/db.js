const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../db/taskmanager.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect to database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.run(`
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
  `);

  // Auto-migrate: add missing columns if old DB exists
  db.all("PRAGMA table_info(projects)", [], (err, cols) => {
    if (err || !cols) return;
    const names = cols.map((c) => c.name);
    if (!names.includes("description"))
      db.run("ALTER TABLE projects ADD COLUMN description TEXT");
    if (!names.includes("created_at"))
      db.run("ALTER TABLE projects ADD COLUMN created_at DATETIME");
  });

  db.all("PRAGMA table_info(tasks)", [], (err, cols) => {
    if (err || !cols) return;
    const names = cols.map((c) => c.name);
    if (!names.includes("description"))
      db.run("ALTER TABLE tasks ADD COLUMN description TEXT");
    if (!names.includes("created_at"))
      db.run("ALTER TABLE tasks ADD COLUMN created_at DATETIME");
  });
});

module.exports = db;