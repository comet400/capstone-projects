const mongoose = require("mongoose");
const path = require("path");

// Load env
require("dotenv").config({ path: path.resolve(__dirname, "../config.env") });

async function connectMongo() {
  try {
    console.log("Connecting to MongoDB...");
    console.log("Mongo URI (masked):", process.env.ATLAS_URI.replace(/:(.*)@/, ":*****@"));

    await mongoose.connect(process.env.ATLAS_URI, {
      serverSelectionTimeoutMS: 10000, // wait max 10s for primary
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    console.log("MongoDB connected with Mongoose ");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

module.exports = { connectMongo };