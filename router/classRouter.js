import express from "express";
import { getAllClasses, createClass, assignStudentToClass, bulkAssignStudents, uploadCSV } from "../controllers/classConroller.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" })

const router = express.Router();

router.get('/getall', getAllClasses);
router.post("/create",  createClass);
router.post("/assign/student",  assignStudentToClass);
router.post("/assign/student/bulk",  bulkAssignStudents);
router.post("/upload-csv",  upload.single("file"), uploadCSV);


export default router;


