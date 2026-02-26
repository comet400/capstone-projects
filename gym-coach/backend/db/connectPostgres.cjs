const { Pool } = require("pg");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../config.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
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

//
// if (require.main === module) {
//   connectPostgres();
// }
// connectPostgres();

module.exports = { pool, connectPostgres };