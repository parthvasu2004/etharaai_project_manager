const express = require("express");
const router = express.Router();
const db = require("../models/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";

// POST /auth/signup
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hash],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            return res.status(409).json({ error: "Username already taken" });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "User created", userId: this.lastID });
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: "User not found" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Invalid password" });

      const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET,
        { expiresIn: "1d" }
      );

      res.json({ token, user: { id: user.id, username: user.username } });
    }
  );
});

// GET /auth/users — for assigning tasks
router.get("/users", require("../middleware/authMiddleware"), (req, res) => {
  db.all("SELECT id, username FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;