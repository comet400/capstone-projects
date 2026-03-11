const express = require("express");
const { pool } = require("../db/connectPostgres.cjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// JWT auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Auth token received:", token);
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    console.log("Token decoded successfully:", decoded);
    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Map fitness_level to a rank
const fitnessLevelToRank = (level) => {
  switch (level.toLowerCase()) {
    case "beginner": return 1;
    case "intermediate": return 2;
    case "pro": return 3;
    default: return 1; // default to intermediate if unknown
  }
};

// Default prescription per fitness level
const getDefaultPrescription = (fitnessLevel) => {
  switch (fitnessLevel.toLowerCase()) {
    case "beginner": return { sets: 3, reps: 10, durationSeconds: 45, restSeconds: 75 };
    case "advanced": return { sets: 5, reps: 5, durationSeconds: 60, restSeconds: 120 };
    case "pro":
    default: return { sets: 4, reps: 8, durationSeconds: 50, restSeconds: 90 };
  }
};

router.post("/generate", authMiddleware, async (req, res) => {
  console.log("/generate route hit");
  const { name, durationWeeks = 4, daysPerWeek = 3, exercisesPerDay = 6 } = req.body || {};
  console.log("Request body:", req.body);
  console.log("Plan params -> name:", name, "durationWeeks:", durationWeeks, "daysPerWeek:", daysPerWeek, "exercisesPerDay:", exercisesPerDay);

  if (daysPerWeek <= 0 || daysPerWeek > 7) return res.status(400).json({ message: "daysPerWeek must be 1-7" });
  if (exercisesPerDay <= 0) return res.status(400).json({ message: "exercisesPerDay must be > 0" });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("Connected to Postgres");

    // 1) Load user profile
    const { rows: profileRows } = await client.query(
      `SELECT user_id, date_of_birth, height_cm, weight_kg, fitness_level FROM users WHERE user_id = $1`,
      [req.userId]
    );
    console.log("Profile query result:", profileRows);
    if (!profileRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }
    const profile = profileRows[0];
    console.log("User profile loaded:", profile);

    // 2) Get primary goal
    const { rows: goalRows } = await client.query(
      `SELECT ug.goal_id, fg.name AS goal_name FROM user_goals ug JOIN fitness_goals fg ON fg.goal_id = ug.goal_id WHERE ug.user_id = $1 ORDER BY ug.priority ASC, ug.set_at DESC LIMIT 1`,
      [req.userId]
    );
    const primaryGoal = goalRows[0] || null;
    console.log("Primary goal query result:", goalRows);

    // 3) Fetch candidate exercises
    const totalExercisesNeeded = daysPerWeek * exercisesPerDay;
    const { rows: exerciseRows } = await client.query(
      `SELECT e.exercise_id, e.name, e.description, e.difficulty_level, e.target_muscles, ec.name AS category
       FROM exercises e
       JOIN exercise_categories ec ON ec.category_id = e.category_id
       LIMIT $1`,
      [totalExercisesNeeded * 2] // fetch extra
    );
    console.log("Exercises fetched:", exerciseRows.length);

    if (!exerciseRows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No exercises found" });
    }

    // 4) Slice exercises into days
    const chosenExercises = exerciseRows.slice(0, totalExercisesNeeded);
    const days = [];
    for (let day = 0; day < daysPerWeek; day++) {
      const start = day * exercisesPerDay;
      const end = start + exercisesPerDay;
      const dayExercises = chosenExercises.slice(start, end);
      if (!dayExercises.length) break;
      days.push({ day_number: day + 1, exercises: dayExercises });
    }
    console.log("Days prepared:", days.map(d => d.day_number));

    // 5) Insert plan
    const planName = name || (primaryGoal ? `AI ${primaryGoal.goal_name} Plan` : "AI Personalized Plan");
    const { rows: planRows } = await client.query(
      `INSERT INTO workout_plans (user_id, name, goal_id, duration_weeks, days_per_week, is_ai_generated)
       VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING *`,
      [req.userId, planName, primaryGoal?.goal_id || null, durationWeeks, daysPerWeek]
    );
    const plan = planRows[0];
    console.log("Workout plan created:", plan);

    const prescription = getDefaultPrescription(profile.fitness_level);
    const responseDays = [];

    for (const day of days) {
      const dayLabel = `Day ${day.day_number}`;
      const { rows: dayRows } = await client.query(
        `INSERT INTO workout_plan_days (plan_id, day_number, day_label) VALUES ($1,$2,$3) RETURNING *`,
        [plan.plan_id, day.day_number, dayLabel]
      );
      const planDay = dayRows[0];

      const dayExercisesResponse = [];
      for (let i = 0; i < day.exercises.length; i++) {
        const ex = day.exercises[i];

        try {
          const { rows: peRows } = await client.query(
            `INSERT INTO workout_plan_exercises
             (plan_day_id, exercise_id, order_index, sets, reps, duration_seconds, rest_seconds, intensity_note)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [
              planDay.plan_day_id,
              ex.exercise_id,
              i + 1,
              prescription.sets,
              prescription.reps,
              prescription.durationSeconds,
              prescription.restSeconds,
              `Auto-generated for ${profile.fitness_level} level`
            ]
          );

          if (!peRows[0]) {
            console.warn("Plan exercise insert returned empty for exercise:", ex.exercise_id);
          }

          const planExercise = peRows[0] || {
            sets: prescription.sets,
            reps: prescription.reps,
            duration_seconds: prescription.durationSeconds,
            rest_seconds: prescription.restSeconds
          };

          dayExercisesResponse.push({
            exercise_id: ex.exercise_id,
            name: ex.name,
            description: ex.description,
            difficulty_level: ex.difficulty_level,
            target_muscles: ex.target_muscles,
            category: ex.category,
            prescription: {
              sets: planExercise.sets,
              reps: planExercise.reps,
              duration_seconds: planExercise.duration_seconds,
              rest_seconds: planExercise.rest_seconds
            }
          });
        } catch (err) {
          console.error("Error inserting exercise", ex.exercise_id, err.message);
          // fallback so frontend won't crash
          dayExercisesResponse.push({
            exercise_id: ex.exercise_id,
            name: ex.name,
            description: ex.description,
            difficulty_level: ex.difficulty_level,
            target_muscles: ex.target_muscles,
            category: ex.category,
            prescription
          });
        }
      }

      responseDays.push({
        plan_day_id: planDay.plan_day_id,
        day_number: planDay.day_number,
        day_label: planDay.day_label,
        exercises: dayExercisesResponse
      });
    }

    await client.query("COMMIT");
    console.log("Workout plan generation complete");

    return res.json({ plan, days: responseDays });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error generating workout plan:", err);
    return res.status(500).json({ error: "Failed to generate workout plan" });
  } finally {
    client.release();
  }
});

module.exports = router;