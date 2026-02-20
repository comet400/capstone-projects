const { MongoClient } = require("mongodb");
const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, "../config.env") });
async function connectMongo() {
  const uri = process.env.ATLAS_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("MongoDB connected");

    const db = client.db("UCoach");

    const collections = await db.listCollections().toArray();

    collections.forEach((col) => {
      console.log("Collection:", col.name);
    });

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.close();
  }
}

module.exports = { connectMongo };
connectMongo();
