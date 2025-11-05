import express from "express";
import {
  createPeriod,
  autoGenerateTimetable,
  getClassTimetable,
  getTeacherTimetable,
  getFreeTeachers,
  updatePeriod,
  getPeriodByClassDayPeriod,
} from "../controllers/timetableController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/period", verifyToken, createPeriod); // manually assign
router.post("/auto-generate", verifyToken, autoGenerateTimetable); // auto-generate
router.get("/class/:classId", verifyToken, getClassTimetable); // class timetable
router.get("/teacher/:teacherId", verifyToken, getTeacherTimetable); // teacher timetable
router.post("/free-teachers", verifyToken, getFreeTeachers); // find available teachers
router.get("/getperiod/:classId/:day/:periodNumber", verifyToken, getPeriodByClassDayPeriod);
router.put("/update/:periodId", verifyToken, updatePeriod);

export default router;
