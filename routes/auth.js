import express from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js"; // Neon pool
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// ✅ Setup transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // your Gmail App Password
  },
});

// ================= SIGNUP =================
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // check duplicate
    const checkUser = await pool.query(
      "SELECT * FROM users_copy WHERE email=$1",
      [email]
    );
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users_copy (email, password_hash, name, is_verified) VALUES ($1, $2, $3, $4) RETURNING *",
      [email, hashedPassword, name, false]
    );

    const user = result.rows[0];

    // create verification token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const verifyUrl = `http://localhost:5000/api/auth/verify/${token}`;

    // send email
    await transporter.sendMail({
      from: `"Task App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Verify your email",
      html: `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    res.json({ message: "Signup successful. Check your email to verify!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= VERIFY =================
router.get("/verify/:token", async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

    await pool.query("UPDATE users_copy SET is_verified = true WHERE id = $1", [
      decoded.id,
    ]);

    res.json({ message: "Email verified successfully!" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users_copy WHERE email = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // check if verified
    if (!user.is_verified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first" });
    }

    // compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET /auth/me - get current user info
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // extracted from JWT
    // console.log("Current User ID:", userId);
    const result = await pool.query(
      "SELECT id, name, email, is_verified, created_at, updated_at FROM users_copy WHERE id=$1",
      [userId]
    );
    if (!result.rows[0])
      return res.status(404).json({ message: "User not found" });
    // console.log("Current User:", result.rows[0]);
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
