import express from "express";
import {
  createAndAssignFeeStructure,
  collectFee,
  updateFeeStructure,
  deleteFeeStructure,
  getFeeStructures,
  getFeeStructureById,
  getAllStudentFees,
  applyScholarship,
  getStudentsWithScholarships,
  getStudentFeeByRegNo,
  searchFees
} from "../controllers/feeController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/structures", verifyToken, createAndAssignFeeStructure); // Create structure
router.get("/structures", verifyToken, getFeeStructures); // Get all structures
router.get("/structures/:classId", verifyToken, getFeeStructureById); // Get structure by ID
//router.post("/assign", verifyToken, assignFeeToStudent);
router.post("/collect", verifyToken, collectFee);
router.get("/student/regno/:registrationNumber", verifyToken, getStudentFeeByRegNo); // Get one student’s fee record
router.get("/all", verifyToken, getAllStudentFees); // Get all student fee records modify required
router.post("/:registrationNumber/scholarship", verifyToken, applyScholarship);
router.get("/with-scholarships", verifyToken, getStudentsWithScholarships);
router.put("/structures/:structureId", verifyToken, updateFeeStructure);
router.delete("/delete/:structureId", verifyToken, deleteFeeStructure);
router.get("/search", verifyToken, searchFees);

export default router;
