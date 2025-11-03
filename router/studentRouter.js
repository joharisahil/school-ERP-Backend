import express from "express";
import { getAllStudents, createStudent ,updateStudent , deleteStudent ,searchStudents,uploadStudentsExcel } from "../controllers/studentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import multer from "multer";
const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get('/getall', verifyToken, getAllStudents);
router.post('/create', verifyToken, createStudent);
router.put("/:id", verifyToken,  updateStudent);
router.delete("/delete/:id", verifyToken, deleteStudent);
router.get("/query/search", verifyToken, searchStudents);
router.post("/upload-excel/forStudent", verifyToken, upload.single("file"), uploadStudentsExcel);

export default router;


