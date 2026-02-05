require("dotenv").config({ path: "./config.env" });
const express = require("express");

const { connectMongo } = require("./db/connectMongo.cjs");
const { connectPostgres } = require("./db/connectPostgres.cjs"); 

const app = express();
app.use(express.json());

async function startServer() {
  try {
    // Connect to both databases
    await connectMongo();
    await connectPostgres(); 

    const port = process.env.PORT || 5000; 
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1); // Stop the server if connections fail
  }
}

startServer();