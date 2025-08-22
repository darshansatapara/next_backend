import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/task.js";
import categoryRoutes from "./routes/categories.js";
dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["https://next-react-woad.vercel.app", "http://localhost:5173"],
    allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
    credentials: true,
  })
);
app.use(express.json());

// routes
app.get("/", (req, res) => {
  res.send("API is running...");
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/categories", categoryRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
