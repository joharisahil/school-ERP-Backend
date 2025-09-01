import express from "express";

import { createTeacher, getAllTeachers } from "../controllers/teacherController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/create', verifyToken, createTeacher);
router.get('/getall', getAllTeachers);



export default router;
 
