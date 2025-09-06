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

//
// 1. Fee Structure Setup (Admin only)
//
router.post("/structures", verifyToken, createFeeStructure);  // Create structure
router.get("/structures", verifyToken, getFeeStructures);     // Get all structures
router.get("/structures/:id", verifyToken, getFeeStructureById); // Get structure by ID

//
// 2. Assign Fee to Student (Admin only)
//
router.post("/assign", verifyToken, assignFeeToStudent);

//
// 3. Collect Fee (Admin only)
//
router.post("/:studentFeeId/pay", verifyToken, collectFee);

//
// 4. Fee Records
//
router.get("/student/:studentId", verifyToken, getStudentFee); // Get one student’s fee record
router.get("/all", verifyToken, getAllStudentFees);            // Get all student fee records

export default router;
