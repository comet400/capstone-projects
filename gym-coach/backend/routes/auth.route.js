const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { pool } = require("../db/connectPostgres.cjs");

const router = express.Router();

// --- REGISTER ---
router.post("/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const exists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user with profile_completed = false
    const result = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, profile_completed) VALUES ($1, $2, $3, false) RETURNING *",
      [full_name, email, hashedPassword]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Return user info + token
    res.json({
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        profile_completed: user.profile_completed,
      },
    });
  } catch (err) {
    //console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// --- LOGIN ---
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    //  log incoming request
    //console.log("Login attempt:", { email, password });

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Trim whitespace just in case
    email = email.trim();
    password = password.trim();

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    // DEBUG: log query result
    //console.log("Database query result:", result.rows);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    // : show hashed password from DB
    //console.log("Hashed password from DB:", user.password_hash);

    const match = await bcrypt.compare(password, user.password_hash);

    // : show match result
    //console.log("Password match result:", match);

    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        profile_completed: user.profile_completed,
        workout_split: user.workout_split || "ppl",
        fitness_goal: user.fitness_goal || "gain_muscle",
      },
    });

  } catch (err) {
    //console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;