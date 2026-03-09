const express = require("express");
const { pool } = require("../db/connectPostgres.cjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Reuse same JWT auth pattern as other routes
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

// Map fitness_level to an integer for comparisons
const fitnessLevelToRank = (level) => {
  switch (level) {
    case "beginner":
      return 1;
    case "intermediate":
      return 2;
    case "advanced":
      return 3;
    default:
      return null;
  }
};

// Basic prescription per fitness level
const getDefaultPrescription = (fitnessLevel) => {
  switch (fitnessLevel) {
    case "beginner":
      return { sets: 3, reps: 10, durationSeconds: 45, restSeconds: 75 };
    case "advanced":
      return { sets: 5, reps: 5, durationSeconds: 60, restSeconds: 120 };
    case "intermediate":
    default:
      return { sets: 4, reps: 8, durationSeconds: 50, restSeconds: 90 };
  }
};

/**
 * POST /api/workout-plan/generate
 *
 * Generates a personalized multi-day workout plan for the authenticated user
 * using their profile, goals, limitations, and the exercise_suitability model.
 *
 * Body (all optional):
 * - name: string           -> custom plan name
 * - durationWeeks: number  -> default: 4
 * - daysPerWeek: number    -> default: 3
 * - exercisesPerDay: number-> default: 6
 */
router.post("/generate", authMiddleware, async (req, res) => {
  const {
    name,
    durationWeeks = 4,
    daysPerWeek = 3,
    exercisesPerDay = 6,
  } = req.body || {};

  if (daysPerWeek <= 0 || daysPerWeek > 7) {
    return res.status(400).json({ message: "daysPerWeek must be between 1 and 7" });
  }
  if (exercisesPerDay <= 0) {
    return res.status(400).json({ message: "exercisesPerDay must be greater than 0" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Load basic user profile (no workout_location/profile_completed required for generate)
    const { rows: profileRows } = await client.query(
      `
      SELECT
        u.user_id,
        u.date_of_birth,
        u.height_cm,
        u.weight_kg,
        u.fitness_level
      FROM users u
      WHERE u.user_id = $1
      `,
      [req.userId]
    );

    if (profileRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const profile = profileRows[0];
    const userFitnessRank = fitnessLevelToRank(profile.fitness_level);

    // 2) Determine the user's primary goal (if any)
    const { rows: goalRows } = await client.query(
      `
      SELECT ug.goal_id, fg.name AS goal_name
      FROM user_goals ug
      JOIN fitness_goals fg ON fg.goal_id = ug.goal_id
      WHERE ug.user_id = $1
      ORDER BY ug.priority ASC, ug.set_at DESC
      LIMIT 1
      `,
      [req.userId]
    );

    const primaryGoal = goalRows[0] || null;

    // 3) Fetch candidate exercises using exercise_suitability and contraindications
    const totalExercisesNeeded = daysPerWeek * exercisesPerDay;

    const { rows: exerciseRows } = await client.query(
      `
      WITH profile AS (
        SELECT
          u.user_id,
          COALESCE(u.gender, 'all') AS gender,
          DATE_PART('year', AGE(u.date_of_birth))::INT AS age,
          u.height_cm,
          u.weight_kg,
          COALESCE(u.fitness_level, 'beginner') AS fitness_level
        FROM users u
        WHERE u.user_id = $1
      ),
      primary_goal AS (
        SELECT $2::BIGINT AS goal_id
      )
      SELECT
        e.exercise_id,
        e.name,
        e.description,
        e.difficulty_level,
        e.target_muscles,
        ec.name AS category,
        es.met_value,
        es.is_high_impact
      FROM exercises e
      JOIN exercise_categories ec ON ec.category_id = e.category_id
      JOIN exercise_suitability es ON es.exercise_id = e.exercise_id
      CROSS JOIN profile p
      LEFT JOIN primary_goal pg ON TRUE
      WHERE
        -- age bounds (when date_of_birth is null, age is null; allow those exercises)
        (p.age IS NULL OR (es.min_age IS NULL OR es.min_age <= p.age))
        AND (p.age IS NULL OR (es.max_age IS NULL OR es.max_age >= p.age))
        -- sex filter
        AND (es.suitable_for_sex IS NULL OR es.suitable_for_sex = 'all' OR es.suitable_for_sex = p.gender)
        -- BMI filter (guard against NULL / zero height)
        AND (
          es.min_bmi IS NULL
          OR (
            p.height_cm IS NOT NULL AND p.height_cm > 0
            AND es.min_bmi <= (p.weight_kg / POWER(p.height_cm / 100.0, 2))
          )
        )
        AND (
          es.max_bmi IS NULL
          OR (
            p.height_cm IS NOT NULL AND p.height_cm > 0
            AND es.max_bmi >= (p.weight_kg / POWER(p.height_cm / 100.0, 2))
          )
        )
        -- minimum fitness level requirement
        AND (
          es.min_fitness_level IS NULL OR
          CASE es.min_fitness_level
            WHEN 'beginner' THEN 1
            WHEN 'intermediate' THEN 2
            WHEN 'advanced' THEN 3
          END <= CASE p.fitness_level
            WHEN 'beginner' THEN 1
            WHEN 'intermediate' THEN 2
            WHEN 'advanced' THEN 3
          END
        )
        -- goal alignment (prefer exercises tagged for this goal, but allow generic ones)
        AND (
          pg.goal_id IS NULL
          OR es.goal_id IS NULL
          OR es.goal_id = pg.goal_id
        )
        -- filter out contraindicated movements based on user_limitations
        AND NOT EXISTS (
          SELECT 1
          FROM user_limitations ul
          JOIN exercise_contraindications ec2
            ON ec2.exercise_id = e.exercise_id
           AND ec2.body_area = ul.body_area
          WHERE ul.user_id = p.user_id
        )
      ORDER BY
        -- prefer exercises with goal match and moderate intensity
        (es.goal_id = pg.goal_id) DESC NULLS LAST,
        es.is_high_impact ASC,
        COALESCE(es.met_value, 5.0) ASC,
        e.difficulty_level ASC
      LIMIT $3
      `,
      [req.userId, primaryGoal ? primaryGoal.goal_id : null, totalExercisesNeeded * 2]
    );

    if (exerciseRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No suitable exercises found for this profile" });
    }

    // 4) Slice exercises into days
    const chosenExercises = exerciseRows.slice(0, totalExercisesNeeded);
    const days = [];
    for (let day = 0; day < daysPerWeek; day++) {
      const start = day * exercisesPerDay;
      const end = start + exercisesPerDay;
      const dayExercises = chosenExercises.slice(start, end);
      if (dayExercises.length === 0) break;
      days.push({ day_number: day + 1, exercises: dayExercises });
    }

    // 5) Insert plan + days + plan exercises
    const planName =
      name ||
      (primaryGoal
        ? `AI ${primaryGoal.goal_name} Plan`
        : "AI Personalized Plan");

    const { rows: planRows } = await client.query(
      `
      INSERT INTO workout_plans (user_id, name, goal_id, duration_weeks, days_per_week, is_ai_generated)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      RETURNING *
      `,
      [
        req.userId,
        planName,
        primaryGoal ? primaryGoal.goal_id : null,
        durationWeeks,
        daysPerWeek,
      ]
    );

    const plan = planRows[0];
    const prescription = getDefaultPrescription(profile.fitness_level);

    const responseDays = [];

    for (const day of days) {
      const dayLabel = `Day ${day.day_number}`;

      const { rows: dayRows } = await client.query(
        `
        INSERT INTO workout_plan_days (plan_id, day_number, day_label)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [plan.plan_id, day.day_number, dayLabel]
      );

      const planDay = dayRows[0];
      const dayExercisesResponse = [];

      for (let i = 0; i < day.exercises.length; i++) {
        const ex = day.exercises[i];

        const { rows: peRows } = await client.query(
          `
          INSERT INTO workout_plan_exercises (
            plan_day_id,
            exercise_id,
            order_index,
            sets,
            reps,
            duration_seconds,
            rest_seconds,
            intensity_note
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
          `,
          [
            planDay.plan_day_id,
            ex.exercise_id,
            i + 1,
            prescription.sets,
            prescription.reps,
            prescription.durationSeconds,
            prescription.restSeconds,
            `Auto-generated for ${profile.fitness_level} level`,
          ]
        );

        const planExercise = peRows[0];

        dayExercisesResponse.push({
          exercise_id: ex.exercise_id,
          name: ex.name,
          description: ex.description,
          difficulty_level: ex.difficulty_level,
          target_muscles: ex.target_muscles,
          category: ex.category,
          suitability: {
            met_value: ex.met_value,
            is_high_impact: ex.is_high_impact,
          },
          prescription: {
            sets: planExercise.sets,
            reps: planExercise.reps,
            duration_seconds: planExercise.duration_seconds,
            rest_seconds: planExercise.rest_seconds,
          },
        });
      }

      responseDays.push({
        plan_day_id: planDay.plan_day_id,
        day_number: planDay.day_number,
        day_label: planDay.day_label,
        exercises: dayExercisesResponse,
      });
    }

    await client.query("COMMIT");

    return res.json({
      plan: {
        plan_id: plan.plan_id,
        name: plan.name,
        goal_id: plan.goal_id,
        duration_weeks: plan.duration_weeks,
        days_per_week: plan.days_per_week,
        is_ai_generated: plan.is_ai_generated,
        generated_at: plan.generated_at,
      },
      days: responseDays,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error generating workout plan:", err.message);
    return res.status(500).json({ error: "Failed to generate workout plan" });
  } finally {
    client.release();
  }
});

module.exports = router;

