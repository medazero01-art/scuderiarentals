import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/User.js";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, password, email, phoneNumber } = req.body;


    if (!username || !password || !email || !phoneNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }


    if (await User.findOne({ username })) {
      return res.status(400).json({ message: "Username already taken" });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already used" });
    }
    if (await User.findOne({ phoneNumber })) {
      return res.status(400).json({ message: "Phone number already used" });
    }


    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);


    const newUser = new User({ username, passwordHash, email, phoneNumber });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;


    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });


    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });


    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.json({ token,
      username: user.username,
      role: user.role,
      email: user.email,
      phoneNumber: user.phoneNumber
     });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});




import authMiddleware from "../Middleware/authMiddleware.js";
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
