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

module.exports = router;