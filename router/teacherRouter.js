import express from "express";

import { createTeacher, getAllTeachers , updateTeacher } from "../controllers/teacherController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', verifyToken,  createTeacher);
router.get('/getall', verifyToken, getAllTeachers);
router.put("/:id", verifyToken, updateTeacher);

export default router;
 
