require("dotenv").config({ path: "./config.env" });
const express = require("express");
const cors = require("cors");
const authRoute = require("./routes/auth.route");
const profileRoute = require("./routes/profile.route");
const meRoute = require("./routes/me.route");
//const { connectMongo } = require("./db/connectMongo.cjs");
const { connectPostgres } = require("./db/connectPostgres.cjs");
const analyzeRoute = require("./routes/analyze.route");
const workoutPlanRoute = require("./routes/workout-plan.route");
const dashboardRoute = require("./routes/dashboard.route");
const workoutsRoute = require("./routes/workouts.route");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/api/analyze", analyzeRoute);
app.use("/api/auth", authRoute);
app.use("/api/auth", authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/me", meRoute);
app.use("/api/workout-plan", workoutPlanRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/workouts", workoutsRoute);

async function runMigrations() {
  const { pool } = require("./db/connectPostgres.cjs");
  try {
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS workout_split TEXT DEFAULT 'ppl';
    `);
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS fitness_goal TEXT DEFAULT 'gain_muscle';
    `);
    // Remove mixed/compound exercises that don't fit strict split rules
    await pool.query(`
      DELETE FROM workout_plan_exercises
      WHERE exercise_id IN (SELECT exercise_id FROM exercises WHERE LOWER(name) = 'push-up to row');
    `).catch(() => {});
    await pool.query(`
      DELETE FROM exercises WHERE LOWER(name) = 'push-up to row';
    `).catch(() => {});
    console.log("Migrations: columns ensured, bad exercises cleaned");
  } catch (err) {
    console.warn("Migration warning (non-fatal):", err.message);
  }
}

async function startServer() {
  console.log("Starting the server");
  try {

    //await connectMongo();
    await connectPostgres();
    await runMigrations();

    const port = process.env.PORT || 5825;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();