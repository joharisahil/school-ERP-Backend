import express from "express";
import {
  createSubject,
  assignSubjectToTeacher,
  getAllSubjects,
  getSubjectsByTeacher,
  getSubjectsByClass,
  deleteSubject,
  assignSubjectToClass
} from "../controllers/subjectController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create",  createSubject);
router.post("/assign/teacher",  assignSubjectToTeacher);
router.post("/assign/class",  assignSubjectToClass)
router.get("/all",  getAllSubjects);
router.get("/teacher/:teacherId",  getSubjectsByTeacher);
router.get("/class/:classId",  getSubjectsByClass);
router.delete("/:subjectId",  deleteSubject);

export default router;
