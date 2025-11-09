import express from "express";
import multer from "multer";
import {
  createTeacher,
  getAllTeachers,
  updateTeacher,
  getTeachersBySubject,
  deleteTeacher,
  uploadTeachersExcel
} from "../controllers/teacherController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/create", verifyToken, createTeacher);
router.get("/getall", verifyToken, getAllTeachers);
router.put("/:id", verifyToken, updateTeacher);
router.get("/subject/:subjectId", verifyToken, getTeachersBySubject);
router.delete("/delete/:id", verifyToken, deleteTeacher);
router.post("/upload-excel/forTeacher",verifyToken,upload.single("file"),uploadTeachersExcel);
export default router;
