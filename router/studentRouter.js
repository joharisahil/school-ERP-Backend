import express from "express";
import { getAllStudents, createStudent ,updateStudent } from "../controllers/studentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/getall', verifyToken, getAllStudents);
router.post('/create', verifyToken, createStudent);
router.put("/:id", verifyToken,  updateStudent);

export default router;


