import express from "express";
import { getAllStudents, createStudent ,updateStudent , deleteStudent ,searchStudents } from "../controllers/studentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/getall', verifyToken, getAllStudents);
router.post('/create', verifyToken, createStudent);
router.put("/:id", verifyToken,  updateStudent);
router.delete("/delete/:id", verifyToken, deleteStudent);
router.get("/query/search", verifyToken, searchStudents);
export default router;


