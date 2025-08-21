import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

// Get all tasks for user
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks_copy WHERE user_id=$1 ORDER BY id DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add task
router.post("/", async (req, res) => {
  const { title, description, status, priority, category_id, due_date } =
    req.body;
  console.log("New Task Data:", req.body);

  try {
    const categoryId = category_id ? parseInt(category_id) : null;

    let dueDate = due_date ? new Date(due_date) : null;
    if (dueDate && isNaN(dueDate.getTime())) {
      return res.status(400).json({ message: "Invalid due date" });
    }

    const result = await pool.query(
      `INSERT INTO tasks_copy 
       (user_id, title, description, status, priority, category_id, due_date) 
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, title, description, status, priority, categoryId, dueDate]
    );

    console.log("New Task Created:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error creating task" });
  }
});

// Update task
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, category_id, due_date } =
    req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks_copy
       SET title=$1, description=$2, status=$3, priority=$4, category_id=$5, due_date=$6, updated_at=NOW() 
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [
        title,
        description,
        status,
        priority,
        category_id || null,
        due_date || null,
        id,
        req.user.id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ message: "Error updating task" });
  }
});

// Delete task
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM tasks_copy WHERE id=$1 AND user_id=$2", [
      id,
      req.user.id,
    ]);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(400).json({ message: "Error deleting task" });
  }
});

export default router;
