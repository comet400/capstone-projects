const express = require("express");
const router = express.Router();
const { pool } = require("../db/connectPostgres.cjs");
const jwt = require("jsonwebtoken");

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/dashboard/overview
router.get("/overview", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // 1) Fetch completed sessions for the current week from workout_sessions
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const sessionsRes = await pool.query(
      `SELECT * FROM workout_sessions 
       WHERE user_id = $1 
         AND status = 'completed' 
         AND start_time BETWEEN $2 AND $3`,
      [userId, weekStart, weekEnd]
    );

    const sessions = sessionsRes.rows;

    let totalMinutes = 0;
    let totalCalories = 0;

    for (const session of sessions) {
      if (session.end_time && session.start_time) {
        const durationMs = new Date(session.end_time) - new Date(session.start_time);
        const durationMin = Math.floor(durationMs / 60000);
        totalMinutes += durationMin;
      }
      totalCalories += session.calories_burned ?? 300;
    }

    let workoutsCompleted = sessions.length;

    // 2) Also count from the workouts table (AI-analyzed workouts)
    try {
      const workoutsRes = await pool.query(
        `SELECT duration_seconds FROM workouts
         WHERE user_id = $1
           AND created_at BETWEEN $2 AND $3`,
        [userId, weekStart, weekEnd]
      );
      workoutsCompleted += workoutsRes.rows.length;
      for (const w of workoutsRes.rows) {
        totalMinutes += Math.round((w.duration_seconds || 0) / 60);
        totalCalories += Math.round(((w.duration_seconds || 0) / 60) * 5);
      }
    } catch (_e) {
      // workouts table may not exist in some setups, ignore
    }

    // 3) Fetch weekly goal and streak from user_metrics
    const metricsRes = await pool.query(
      `SELECT * FROM user_metrics WHERE user_id = $1 ORDER BY calculated_at DESC LIMIT 1`,
      [userId]
    );
    const metrics = metricsRes.rows[0];

    const weeklyGoalDays = metrics?.weekly_goal_days ?? 3; // fallback
    const streak = metrics?.streak ?? 0;

    const weeklyProgress = Math.min(
      Math.round((workoutsCompleted / weeklyGoalDays) * 100),
      100
    );

    res.json({
      weeklyProgress,
      totalMinutes,
      totalCalories,
      workoutsCompleted,
      streak,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch dashboard overview" });
  }
});

module.exports = router;