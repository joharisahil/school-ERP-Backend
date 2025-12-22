import express from "express";
import {
  getAllClasses,
  createClass,
  assignStudentToClass,
  bulkAssignStudents,
  uploadCSV,
} from "../controllers/classController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorize.js";
import { schoolContext } from "../middlewares/schoolContext.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.get(
  "/getall",
  verifyToken,
  authorize("admin", "accountant"),
  schoolContext,
  getAllClasses
);
router.post("/create", verifyToken, createClass);
router.post("/assign/student", verifyToken, assignStudentToClass);
router.post("/assign/student/bulk", verifyToken, bulkAssignStudents);
router.post("/upload-csv", upload.single("file"), verifyToken, uploadCSV);

export default router;
