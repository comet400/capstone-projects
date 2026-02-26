const mongoose = require("mongoose");
const User = require("../models/user.model"); // adjust path if needed
const jwt = require("jsonwebtoken");

const loginUser = async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "Name and password required" });
  }

  try {
    const user = await User.findOne({ name });

    if (!user) return res.status(404).json({ error: "User not found" });

    // TEMP: plain text password for now (later use bcrypt!)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({ token, user: { name: user.name, id: user._id } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { loginUser };