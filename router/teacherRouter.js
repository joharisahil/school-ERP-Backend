import express from "express";

import { createTeacher, getAllTeachers , updateTeacher, getTeachersBySubject } from "../controllers/teacherController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', verifyToken,  createTeacher);
router.get('/getall', verifyToken, getAllTeachers);
router.put("/:id", verifyToken, updateTeacher);
router.get("/subject/:subjectId", verifyToken, getTeachersBySubject);

export default router;
 
