const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";

// POST /auth/signup
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Username and password are required" });

  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: "Username already taken" });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, password: hash });

    res.status(201).json({ message: "User created", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Username and password are required" });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /auth/users — for assigning tasks
router.get("/users", require("../middleware/authMiddleware"), async (req, res) => {
  try {
    const users = await User.find({}, "_id username");
    // Map _id to id for frontend consistency
    res.json(users.map((u) => ({ id: u._id, username: u.username })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;