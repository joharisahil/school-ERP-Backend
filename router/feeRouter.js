import express from "express";
import {
  createFeeStructure,
  assignFeeToStudent,
  collectFee,
  getFeeStructures,
  getFeeStructureById,
  getStudentFee,
  getAllStudentFees,
  applyScholarship,
  getStudentsWithScholarships
} from "../controllers/feeController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/structures",  createFeeStructure);  // Create structure
router.get("/structures",  getFeeStructures);     // Get all structures
router.get("/structures/:classId",  getFeeStructureById); // Get structure by ID
router.post("/assign",  assignFeeToStudent);
router.post("/:studentFeeId/pay",  collectFee);
router.get("/student/:studentId",  getStudentFee); // Get one student’s fee record
router.get("/all", verifyToken, getAllStudentFees);            // Get all student fee records
router.post("/:studentFeeId/scholarship", applyScholarship);
router.get("/with-scholarships", verifyToken, getStudentsWithScholarships);


export default router;
