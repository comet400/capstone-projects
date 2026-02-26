// ViewUser.js
const mongoose = require("mongoose");
const User = require("./models/user"); // adjust path if needed
require("dotenv").config({ path: "./config.env" });

async function viewUsers() {
  try {
    await mongoose.connect(process.env.ATLAS_URI);

    const users = await User.find({}, { password: 0 }); // hide passwords
    console.log("Users in DB:");
    console.table(users.map(u => ({ id: u._id.toString(), name: u.name })));

    mongoose.disconnect();
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}

viewUsers();