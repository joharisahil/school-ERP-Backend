import express from "express";

import { createTeacher, getAllTeachers , updateTeacher } from "../controllers/teacherController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create',  createTeacher);
router.get('/getall', getAllTeachers);
router.put("/:id",  updateTeacher);

export default router;
 
