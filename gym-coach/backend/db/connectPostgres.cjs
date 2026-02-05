const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require("dotenv").config({ path: path.resolve(__dirname, "../config.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessary for connecting to cloud databases like Supabase
  }
});

const connectPostgres = async () => {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to Supabase (PostgreSQL)");
    client.release();
    return pool;
  } catch (err) {
    console.error("PostgreSQL connection error:", err.message);
  }
};

// Immediately test the connection if running this file directly
if (require.main === module) {
  connectPostgres();
}

module.exports = { pool, connectPostgres };