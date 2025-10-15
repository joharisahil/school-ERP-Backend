import express from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectsByTeacher,
  getSubjectsByClass,
  deleteSubject,
  assignSubjectToClass,
  toggleSubjectTeacherAssignment,
  updateSubject,
} from "../controllers/subjectController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", verifyToken, createSubject);
//router.post("/assign/teacher", verifyToken, assignSubjectToTeacher);
router.post(
  "/subjects/toggle-teacher",
  verifyToken,
  toggleSubjectTeacherAssignment
);
router.put("/update/:subjectId", verifyToken, updateSubject);
router.post("/assign/class", verifyToken, assignSubjectToClass);
router.get("/all", verifyToken, getAllSubjects);
router.get("/teacher/:teacherId", verifyToken, getSubjectsByTeacher);
router.get("/class/:classId", verifyToken, getSubjectsByClass);
router.delete("/:subjectId", verifyToken, deleteSubject);

export default router;
