import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

// Get all categories for user
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories_copy WHERE user_id=$1 ORDER BY id DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add category
router.post("/", async (req, res) => {
  const { name } = req.body;
  console.log("New Category Name:", name);
  // Make sure user exists
  console.log("Current User ID:", req.user.id);
  const userCheck = await pool.query("SELECT id FROM users_copy WHERE id=$1", [
    req.user.id,
  ]);
  if (userCheck.rows.length === 0) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (!name) return res.status(400).json({ message: "Name is required" });

  const result = await pool.query(
    "INSERT INTO categories_copy (name, user_id) VALUES ($1,$2) RETURNING *",
    [name, req.user.id]
  );
  console.log("New Category Created:", result.rows[0]);
  res.status(201).json(result.rows[0]);
});

// Update category
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await pool.query(
      "UPDATE categories_copy SET name=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *",
      [name, id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ message: "Error updating category" });
  }
});

// Delete category
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM categories_copy WHERE id=$1 AND user_id=$2", [
      id,
      req.user.id,
    ]);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(400).json({ message: "Error deleting category" });
  }
});

export default router;
