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

// GET /api/workouts/stats — aggregated stats for progress & highlights
router.get("/stats", requireAuth, async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    // All workouts for this user
    const allRes = await client.query(
      `SELECT id, exercise_type, duration_seconds, overall_score,
              grade, total_reps, performance_tier, created_at
       FROM workouts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );
    const rows = allRes.rows;

    if (rows.length === 0) {
      return res.json({
        totalWorkouts: 0,
        totalMinutes: 0,
        totalCalories: 0,
        bestScore: 0,
        avgScore: 0,
        totalReps: 0,
        totalHours: 0,
        exerciseBreakdown: [],
        weeklyWorkouts: [],
        recentScores: [],
      });
    }

    const totalWorkouts = rows.length;
    const totalSeconds = rows.reduce((s, r) => s + (r.duration_seconds || 0), 0);
    const totalMinutes = Math.round(totalSeconds / 60);
    const totalHours = +(totalSeconds / 3600).toFixed(1);
    // Rough calorie estimate: ~5 kcal per minute of exercise
    const totalCalories = Math.round(totalMinutes * 5);
    const bestScore = Math.round(Math.max(...rows.map((r) => r.overall_score || 0)));
    const avgScore = Math.round(
      rows.reduce((s, r) => s + (r.overall_score || 0), 0) / totalWorkouts
    );
    const totalReps = rows.reduce((s, r) => s + (r.total_reps || 0), 0);

    // Exercise breakdown: count per exercise type
    const exerciseMap = {};
    for (const r of rows) {
      const key = r.exercise_type || "unknown";
      exerciseMap[key] = (exerciseMap[key] || 0) + 1;
    }
    const exerciseBreakdown = Object.entries(exerciseMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Weekly workout counts (last 4 weeks)
    const weeklyWorkouts = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const count = rows.filter((r) => {
        const d = new Date(r.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeklyWorkouts.push({
        weekLabel: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count,
      });
    }

    // Recent 10 scores for trend
    const recentScores = rows
      .slice(0, 10)
      .reverse()
      .map((r) => ({
        score: Math.round(r.overall_score || 0),
        date: r.created_at,
        exercise: r.exercise_type,
      }));

    res.json({
      totalWorkouts,
      totalMinutes,
      totalCalories,
      totalHours,
      bestScore,
      avgScore,
      totalReps,
      exerciseBreakdown,
      weeklyWorkouts,
      recentScores,
    });
  } catch (err) {
    console.error("Workout stats error:", err);
    res.status(500).json({ message: "Failed to compute stats" });
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