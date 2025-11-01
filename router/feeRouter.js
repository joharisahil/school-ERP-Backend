import express from "express";
import {
  createAndAssignFeeStructure,
  collectFee,
  updateFeeStructure,
  deleteFeeStructure,
  getFeeStructures,
  getFeeStructureById,
  getAllStudentFees,
  getStudentFeeByRegNo,
  searchFees,
} from "../controllers/feeController.js";
import {
  applyScholarship,
  removeScholarship,
  getStudentsWithScholarships,
} from "../controllers/scholarshipController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/structures", verifyToken, createAndAssignFeeStructure); // Create structure
router.post("/:registrationNumber/scholarship", verifyToken, applyScholarship);
router.post("/collect", verifyToken, collectFee);
router.get("/structures", verifyToken, getFeeStructures); // Get all structures
router.get("/structures/:classId", verifyToken, getFeeStructureById); // Get structure by ID
router.get("/student/regno/:registrationNumber",verifyToken,getStudentFeeByRegNo); // Get one student’s fee record
router.get("/all", verifyToken, getAllStudentFees); // Get all student fee records modify required
router.get("/with-scholarships", verifyToken, getStudentsWithScholarships);
router.get("/search", verifyToken, searchFees);
router.put("/structures/:structureId", verifyToken, updateFeeStructure);
router.delete("/delete/:structureId", verifyToken, deleteFeeStructure);
router.delete("remove/scholarship/:registrationNumber/:scholarshipId",verifyToken,removeScholarship);

export default router;

//router.post("/assign", verifyToken, assignFeeToStudent);