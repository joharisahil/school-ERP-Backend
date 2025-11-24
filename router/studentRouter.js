import express from "express";
import { getAllStudents, createStudent ,updateStudent , deleteStudent ,searchStudents ,uploadStudentsExcel ,getStudentById, testUploadStudentsExcel} from "../controllers/studentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import multer from "multer";
const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get('/getall', verifyToken, getAllStudents);
router.post('/create', verifyToken, createStudent);
router.get("/get/:id", verifyToken, getStudentById);
router.put("/:id", verifyToken,  updateStudent);
router.delete("/delete/:id", verifyToken, deleteStudent);
router.get("/query/search", verifyToken, searchStudents);
router.post("/upload-excel/forStudent", verifyToken, upload.single("file"), uploadStudentsExcel);
router.post("/upload-excel/forStudenttest", verifyToken, upload.single("file"), testUploadStudentsExcel);

export default router;


