require("dotenv").config({ path: "./config.env" });
const express = require("express");

const { connectMongo } = require("./db/connectMongo.cjs");
const { connectPostgres } = require("./db/connectPostgres.cjs");

const analyzeRoute = require("./routes/analyze.route");

const app = express();
app.use(express.json());

app.use("/api/analyze", analyzeRoute);

async function startServer() {
  try {

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
