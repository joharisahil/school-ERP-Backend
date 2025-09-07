import express from "express";
import {
  createFeeStructure,
  assignFeeToStudent,
  collectFee,
  getFeeStructures,
  getFeeStructureById,
  getStudentFee,
  getAllStudentFees,
} from "../controllers/feeController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/structures", verifyToken, createFeeStructure);  // Create structure
router.get("/structures", verifyToken, getFeeStructures);     // Get all structures
router.get("/structures/:classId", verifyToken, getFeeStructureById); // Get structure by ID
router.post("/assign", verifyToken, assignFeeToStudent);
router.post("/:studentFeeId/pay", verifyToken, collectFee);
router.get("/student/:studentId", verifyToken, getStudentFee); // Get one student’s fee record
router.get("/all", verifyToken, getAllStudentFees);            // Get all student fee records

export default router;
