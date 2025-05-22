import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import testRoutes from "./routes/tests.js";
import classRoutes from "./routes/classes.js";
import calendarRoutes from "./routes/calendar.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/calendar", calendarRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Exam Matrix API is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
