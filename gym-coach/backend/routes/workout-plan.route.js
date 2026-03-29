const express = require("express");
const { pool } = require("../db/connectPostgres.cjs");
const jwt = require("jsonwebtoken");
const {
  SPLIT_TYPES,
  matchesDayType,
  getWeekSchedule,
  getSplitDefinition,
  getAllSplitTypes,
  getGoalDefinition,
  getGoalPrescription,
  getAllGoalTypes,
  buildDayExercises,
} = require("../lib/split-definitions");

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const fitnessLevelToRank = (level) => {
  switch ((level || "").toLowerCase()) {
    case "beginner": return 1;
    case "intermediate": return 2;
    case "advanced": return 3;
    default: return 1;
  }
};

const getDefaultPrescription = (fitnessLevel) => {
  const level = (fitnessLevel && String(fitnessLevel).toLowerCase()) || "intermediate";
  switch (level) {
    case "beginner": return { sets: 3, reps: 10, durationSeconds: 45, restSeconds: 75 };
    case "advanced": return { sets: 5, reps: 5, durationSeconds: 60, restSeconds: 120 };
    default: return { sets: 4, reps: 8, durationSeconds: 50, restSeconds: 90 };
  }
};

router.get("/split-types", (_req, res) => {
  res.json(getAllSplitTypes());
});

router.get("/goal-types", (_req, res) => {
  res.json(getAllGoalTypes());
});

// POST /generate-week — build a weekly plan for the user's selected (or requested) split
router.get("/generate-week", (_req, res) => {
  res.status(405).set("Allow", "POST").json({ error: "Method not allowed", use: "POST with Authorization" });
});

router.post("/generate-week", authMiddleware, async (req, res) => {
  const { splitType: reqSplit, goal: reqGoal } = req.body || {};

  const client = await pool.connect();
  try {
    const { rows: profileRows } = await client.query(
      `SELECT user_id, fitness_level, workout_split, fitness_goal FROM users WHERE user_id = $1`,
      [req.userId]
    );
    if (!profileRows.length) {
      return res.status(401).json({ message: "User not found", code: "USER_NOT_FOUND" });
    }
    const profile = profileRows[0];
    const splitId = reqSplit || profile.workout_split || "ppl";
    const goalId  = reqGoal  || profile.fitness_goal  || "gain_muscle";
    const split = getSplitDefinition(splitId);
    const goalDef = getGoalDefinition(goalId);
    const schedule = getWeekSchedule(splitId, profile.fitness_level);

    const { rows: allRows } = await client.query(
      `SELECT e.exercise_id, e.name, e.description, e.difficulty_level, e.target_muscles, ec.name AS category
       FROM exercises e
       JOIN exercise_categories ec ON ec.category_id = e.category_id`
    );
    if (!allRows.length) return res.status(400).json({ message: "No exercises found" });

    const uniqueDayTypes = [...new Set(schedule.filter((d) => d !== "Rest"))];

    const days = {};
    uniqueDayTypes.forEach((dayType, idx) => {
      const { exercises: chosen, prescription: rx, estimatedMinutes } =
        buildDayExercises(allRows, dayType, goalId, profile.fitness_level);

      days[dayType] = {
        plan_day_id: `split-${dayType.toLowerCase().replace(/[^a-z]/g, "-")}`,
        day_number: idx + 1,
        day_label: dayType,
        estimatedMinutes,
        exercises: chosen.map((ex) => ({
          exercise_id: ex.exercise_id,
          name: ex.name,
          description: ex.description,
          difficulty_level: ex.difficulty_level,
          target_muscles: ex.target_muscles,
          category: ex.category,
          prescription: {
            sets: rx.sets,
            reps: rx.reps,
            duration_seconds: rx.durationSeconds,
            rest_seconds: rx.restSeconds,
          },
        })),
      };
    });

    return res.json({
      splitType: splitId,
      splitName: split.name,
      goal: goalId,
      goalName: goalDef ? goalDef.name : "General",
      schedule,
      days,
    });
  } catch (err) {
    console.error("Error generating week plan:", err);
    return res.status(500).json({ error: "Failed to generate week plan" });
  } finally {
    client.release();
  }
});

// POST /generate — full plan generation (persisted to DB)
router.post("/generate", authMiddleware, async (req, res) => {
  const {
    name,
    durationWeeks = 4,
    daysPerWeek = 3,
    exercisesPerDay = 6,
    week,
    splitType: reqSplit,
  } = req.body || {};

  if (week === true) {
    const client = await pool.connect();
    try {
      const { rows: profileRows } = await client.query(
        `SELECT user_id, fitness_level, workout_split, fitness_goal FROM users WHERE user_id = $1`,
        [req.userId]
      );
      if (!profileRows.length) {
        return res.status(401).json({ message: "User not found", code: "USER_NOT_FOUND" });
      }
      const profile = profileRows[0];
      const splitId = reqSplit || profile.workout_split || "ppl";
      const goalId  = req.body.goal || profile.fitness_goal || "gain_muscle";
      const split = getSplitDefinition(splitId);
      const goalDef = getGoalDefinition(goalId);
      const schedule = getWeekSchedule(splitId, profile.fitness_level);

      const { rows: allRows } = await client.query(
        `SELECT e.exercise_id, e.name, e.description, e.difficulty_level, e.target_muscles, ec.name AS category
         FROM exercises e
         JOIN exercise_categories ec ON ec.category_id = e.category_id`
      );
      if (!allRows.length) {
        return res.status(400).json({ message: "No exercises found" });
      }

      const uniqueDayTypes = [...new Set(schedule.filter((d) => d !== "Rest"))];
      const days = {};
      uniqueDayTypes.forEach((dayType, idx) => {
        const { exercises: chosen, prescription: rx, estimatedMinutes } =
          buildDayExercises(allRows, dayType, goalId, profile.fitness_level);

        days[dayType] = {
          plan_day_id: `split-${dayType.toLowerCase().replace(/[^a-z]/g, "-")}`,
          day_number: idx + 1,
          day_label: dayType,
          estimatedMinutes,
          exercises: chosen.map((ex) => ({
            exercise_id: ex.exercise_id,
            name: ex.name,
            description: ex.description,
            difficulty_level: ex.difficulty_level,
            target_muscles: ex.target_muscles,
            category: ex.category,
            prescription: {
              sets: rx.sets,
              reps: rx.reps,
              duration_seconds: rx.durationSeconds,
              rest_seconds: rx.restSeconds,
            },
          })),
        };
      });

      return res.json({
        splitType: splitId,
        splitName: split.name,
        goal: goalId,
        goalName: goalDef ? goalDef.name : "General",
        schedule,
        days,
      });
    } catch (err) {
      console.error("Error generating week (via /generate?week=true):", err);
      return res.status(500).json({ error: "Failed to generate week plan" });
    } finally {
      client.release();
    }
  }

  if (daysPerWeek <= 0 || daysPerWeek > 7) return res.status(400).json({ message: "daysPerWeek must be 1-7" });
  if (exercisesPerDay <= 0) return res.status(400).json({ message: "exercisesPerDay must be > 0" });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: profileRows } = await client.query(
      `SELECT user_id, date_of_birth, height_cm, weight_kg, fitness_level, workout_split, fitness_goal FROM users WHERE user_id = $1`,
      [req.userId]
    );
    if (!profileRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }
    const profile = profileRows[0];
    const splitId = reqSplit || profile.workout_split || "ppl";
    const goalId  = req.body.goal || profile.fitness_goal || "gain_muscle";
    const split = getSplitDefinition(splitId);
    const goalDef = getGoalDefinition(goalId);
    const schedule = getWeekSchedule(splitId, profile.fitness_level);
    const activeDays = schedule.filter((d) => d !== "Rest");
    const effectiveDaysPerWeek = Math.min(daysPerWeek, activeDays.length);

    const { rows: goalRows } = await client.query(
      `SELECT ug.goal_id, fg.name AS goal_name FROM user_goals ug JOIN fitness_goals fg ON fg.goal_id = ug.goal_id WHERE ug.user_id = $1 ORDER BY ug.priority ASC, ug.set_at DESC LIMIT 1`,
      [req.userId]
    );
    const primaryGoal = goalRows[0] || null;

    const { rows: exerciseRows } = await client.query(
      `SELECT e.exercise_id, e.name, e.description, e.difficulty_level, e.target_muscles, ec.name AS category
       FROM exercises e
       JOIN exercise_categories ec ON ec.category_id = e.category_id`
    );
    if (!exerciseRows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No exercises found" });
    }

    const goalLabel = goalDef ? goalDef.shortName : (primaryGoal ? primaryGoal.goal_name : "General");
    const planName = name || `AI ${goalLabel} ${split.shortName} Plan`;
    const { rows: planRows } = await client.query(
      `INSERT INTO workout_plans (user_id, name, goal_id, duration_weeks, days_per_week, is_ai_generated)
       VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING *`,
      [req.userId, planName, primaryGoal?.goal_id || null, durationWeeks, effectiveDaysPerWeek]
    );
    const plan = planRows[0];
    const responseDays = [];

    const uniqueActiveDays = activeDays.slice(0, effectiveDaysPerWeek);

    for (let dayIdx = 0; dayIdx < uniqueActiveDays.length; dayIdx++) {
      const dayType = uniqueActiveDays[dayIdx];
      const { exercises: chosen, prescription: rx, estimatedMinutes } =
        buildDayExercises(exerciseRows, dayType, goalId, profile.fitness_level);

      const { rows: dayRows } = await client.query(
        `INSERT INTO workout_plan_days (plan_id, day_number, day_label) VALUES ($1,$2,$3) RETURNING *`,
        [plan.plan_id, dayIdx + 1, dayType]
      );
      const planDay = dayRows[0];

      const dayExercisesResponse = [];
      for (let i = 0; i < chosen.length; i++) {
        const ex = chosen[i];
        try {
          const { rows: peRows } = await client.query(
            `INSERT INTO workout_plan_exercises
             (plan_day_id, exercise_id, order_index, sets, reps, duration_seconds, rest_seconds, intensity_note)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [
              planDay.plan_day_id,
              ex.exercise_id,
              i + 1,
              rx.sets,
              rx.reps,
              rx.durationSeconds,
              rx.restSeconds,
              `${goalDef ? goalDef.name : "General"} — ${profile.fitness_level} level`,
            ]
          );
          const planExercise = peRows[0] || {
            sets: rx.sets,
            reps: rx.reps,
            duration_seconds: rx.durationSeconds,
            rest_seconds: rx.restSeconds,
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
              rest_seconds: planExercise.rest_seconds,
            },
          });
        } catch (err) {
          console.error("Error inserting exercise", ex.exercise_id, err.message);
          dayExercisesResponse.push({
            exercise_id: ex.exercise_id,
            name: ex.name,
            description: ex.description,
            difficulty_level: ex.difficulty_level,
            target_muscles: ex.target_muscles,
            category: ex.category,
            prescription: { sets: rx.sets, reps: rx.reps, duration_seconds: rx.durationSeconds, rest_seconds: rx.restSeconds },
          });
        }
      }

      responseDays.push({
        plan_day_id: planDay.plan_day_id,
        day_number: planDay.day_number,
        day_label: planDay.day_label,
        estimatedMinutes,
        exercises: dayExercisesResponse,
      });
    }

    await client.query("COMMIT");

    return res.json({ plan, days: responseDays, splitType: splitId, splitName: split.shortName, goal: goalId, goalName: goalDef ? goalDef.name : "General" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error generating workout plan:", err);
    return res.status(500).json({ error: "Failed to generate workout plan" });
  } finally {
    client.release();
  }
});

module.exports = router;
