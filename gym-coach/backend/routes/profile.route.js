const express = require("express");
const { pool } = require("../db/connectPostgres.cjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Middleware to check JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// --- Update profile ---
router.post("/update", authMiddleware, async (req, res) => {
  try {
    const { date_of_birth, height_cm, weight_kg, fitness_level, workout_location } = req.body;

    if (!date_of_birth || !height_cm || !weight_kg || !fitness_level || !workout_location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await pool.query(
      `UPDATE users
       SET date_of_birth=$1, height_cm=$2, weight_kg=$3, fitness_level=$4, workout_location=$5, profile_completed=true, updated_at=NOW()
       WHERE user_id=$6
       RETURNING *`,
      [date_of_birth, height_cm, weight_kg, fitness_level, workout_location, req.userId]
    );

    res.json({ user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Update workout split ---
const VALID_SPLITS = ["ppl", "arnold", "ppl_arnold", "bro", "upper_lower", "full_body"];
const VALID_GOALS = ["lose_weight", "gain_muscle", "endurance", "hybrid"];

router.post("/update-split", authMiddleware, async (req, res) => {
  try {
    const { workout_split } = req.body;

    if (!workout_split || !VALID_SPLITS.includes(workout_split)) {
      return res.status(400).json({
        message: "Invalid split type",
        valid: VALID_SPLITS,
      });
    }

    const result = await pool.query(
      `UPDATE users SET workout_split = $1, updated_at = NOW() WHERE user_id = $2 RETURNING user_id, workout_split`,
      [workout_split, req.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Update fitness goal ---
router.post("/update-goal", authMiddleware, async (req, res) => {
  try {
    const { fitness_goal } = req.body;

    if (!fitness_goal || !VALID_GOALS.includes(fitness_goal)) {
      return res.status(400).json({
        message: "Invalid goal type",
        valid: VALID_GOALS,
      });
    }

    const result = await pool.query(
      `UPDATE users SET fitness_goal = $1, updated_at = NOW() WHERE user_id = $2 RETURNING user_id, fitness_goal`,
      [fitness_goal, req.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Get current user profile ---
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, email, full_name, fitness_level, workout_location, profile_completed, workout_split, fitness_goal
       FROM users
       WHERE user_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const row = result.rows[0];
    row.fitness_goal = row.fitness_goal || "gain_muscle";
    row.workout_split = row.workout_split || "ppl";
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;