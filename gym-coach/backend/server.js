require("dotenv").config({ path: "./config.env" });
const express = require("express");
const authRoute = require("./routes/auth.route");
const profileRoute = require("./routes/profile.route");
const meRoute = require("./routes/me.route");

const { connectMongo } = require("./db/connectMongo.cjs");
const { connectPostgres } = require("./db/connectPostgres.cjs");

const analyzeRoute = require("./routes/analyze.route");

const app = express();
app.use(express.json());

app.use("/api/analyze", analyzeRoute);
app.use("/api/auth", authRoute);
app.use("/api/auth", authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/me", meRoute);

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
