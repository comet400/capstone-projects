const express = require("express");
const router = express.Router();
const { pool } = require("../db/connectPostgres.cjs");

// GET /api/exercises?target_muscles=Biceps
router.get("/", async (req, res) => {
  try {
    const muscle = req.query.target_muscles;

    let query = "SELECT * FROM exercises";
    let params = [];

    if (muscle) {
      query += " WHERE target_muscles ILIKE $1"; // case-insensitive
      params.push(muscle);
    }

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching exercises:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;