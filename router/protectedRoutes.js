// routes/protectedRoutes.js
import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Example: Admin-only route
router.get("/admin/dashboard", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  res.json({ success: true, message: "Welcome to Admin Dashboard" });
});

// Example: Student-only route
router.get("/student/dashboard", verifyToken, (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  res.json({ success: true, message: "Welcome to Student Dashboard" });
});

// Example: Teacher-only route
router.get("/teacher/dashboard", verifyToken, (req, res) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  res.json({ success: true, message: "Welcome to Teacher Dashboard" });
});

export default router;
