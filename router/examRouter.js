import express from "express";
import {
  createExam,
  createExamSchedule,
  getExamTimetable,
  getExamScheduleById,
  getAllScheduledExams,
  autoScheduleExam
} from "../controllers/examController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Exams
router.post("/exam", verifyToken, createExam);
router.post("/exam-schedule", verifyToken, createExamSchedule);
router.get("/exam/:examId/schedules", verifyToken, getExamTimetable);
router.get("/exam-schedule/:scheduleId", verifyToken, getExamScheduleById);
router.get("/exam-schedules", verifyToken, getAllScheduledExams);

// Auto Scheduling
router.post("/exam/:examId/auto-schedule", verifyToken, autoScheduleExam);

export default router;

