// CreateUser.js
const mongoose = require("mongoose");
const User = require("./models/user"); 
require("dotenv").config({ path: "./config.env" });

async function createUser(name, password) {
  try {
    await mongoose.connect(process.env.ATLAS_URI);

    // Remove existing user
    await User.deleteMany({ name });

    const user = await User.create({
      name,
      password, 
    });

    console.log("User created:", user);
    mongoose.disconnect();
  } catch (err) {
    console.error("Error creating user:", err);
  }
}

// Example :
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log("Usage: node CreateUser.js <name> <password>");
  process.exit(1);
}

createUser(args[0], args[1]);