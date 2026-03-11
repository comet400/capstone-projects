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

    // 1) Fetch completed sessions for the current week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Saturday

    const sessionsRes = await pool.query(
      `SELECT * FROM workout_sessions 
       WHERE user_id = $1 
         AND status = 'completed' 
         AND start_time BETWEEN $2 AND $3`,
      [userId, weekStart, weekEnd]
    );

    const sessions = sessionsRes.rows;

    // 2) Calculate total minutes & workouts
    let totalMinutes = 0;
    let totalCalories = 0;

    for (const session of sessions) {
      if (session.end_time && session.start_time) {
        const durationMs = new Date(session.end_time) - new Date(session.start_time);
        const durationMin = Math.floor(durationMs / 60000);
        totalMinutes += durationMin;
      }

      // calories column in session? if not, fallback 300 per workout
      totalCalories += session.calories_burned ?? 300;
    }

    const workoutsCompleted = sessions.length;

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