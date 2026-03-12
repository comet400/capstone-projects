const express = require("express");
const router = express.Router();
const { pool } = require("../db/connectPostgres.cjs");
const jwt = require("jsonwebtoken");

// Middleware: pull user_id from JWT
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ message: "No token" });

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);

    req.userId =
      payload.userId ??
      payload.user_id ??
      payload.id ??
      payload.sub;

    if (!req.userId)
      return res.status(401).json({ message: "Invalid token payload" });

    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// POST /api/workouts — save a completed workout
router.post("/", requireAuth, async (req, res) => {
  const {
    exercise_type,
    duration_seconds,
    overall_score,
    grade,
    total_reps,
    performance_tier,
    report,
    thumbnail_base64,
  } = req.body;

  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `INSERT INTO workouts
        (user_id, exercise_type, duration_seconds, overall_score,
         grade, total_reps, performance_tier, report_json, thumbnail_base64)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        req.userId,
        exercise_type,
        duration_seconds,
        overall_score,
        grade,
        total_reps,
        performance_tier,
        JSON.stringify(report),
        thumbnail_base64 ?? null,
      ]
    );

    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error("Save workout error:", err);
    res.status(500).json({ message: "Failed to save workout" });
  } finally {
    if (client) client.release();
  }
});

// GET /api/workouts — list workouts for logged-in user
router.get("/", requireAuth, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `SELECT id, exercise_type, duration_seconds, overall_score,
              grade, total_reps, performance_tier,
              thumbnail_base64, created_at
       FROM workouts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("List workouts error:", err);
    res.status(500).json({ message: "Failed to fetch workouts" });
  } finally {
    if (client) client.release();
  }
});

// GET /api/workouts/:id — single workout with full report
router.get("/:id", requireAuth, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `SELECT id, exercise_type, duration_seconds, overall_score,
              grade, total_reps, performance_tier,
              report_json, thumbnail_base64, created_at
       FROM workouts
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "Workout not found" });

    const row = result.rows[0];

    res.json({
      ...row,
      report: JSON.parse(row.report_json),
      report_json: undefined,
    });
  } catch (err) {
    console.error("Get workout error:", err);
    res.status(500).json({ message: "Failed to fetch workout" });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;