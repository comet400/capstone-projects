require("dotenv").config({ path: "./config.env" });
const express = require("express");
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/api/analyze", analyzeRoute);
app.use("/api/auth", authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/me", meRoute);
app.use("/api/workout-plan", workoutPlanRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/workouts", workoutsRoute);

async function startServer() {
  console.log("Starting the server");
  try {

    //await connectMongo();
    await connectPostgres(); 

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