// import express from "express";
// import {
//   createAndAssignFeeStructure,
//   collectFee,
//   updateFeeStructure,
//   deleteFeeStructure,
//   getFeeStructures,
//   getFeeStructureById,
//   getAllStudentFees,
//   getStudentFeeByRegNo,
//   searchFees,
// } from "../controllers/feeController.js";
// import {
//   applyScholarship,
//   removeScholarship,
//   getStudentsWithScholarships,
// } from "../controllers/scholarshipController.js";
// import { verifyToken } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// router.post("/structures", verifyToken, createAndAssignFeeStructure); // Create structure
// router.post("/:registrationNumber/scholarship", verifyToken, applyScholarship);
// router.post("/collect", verifyToken, collectFee);
// router.get("/structures", verifyToken, getFeeStructures); // Get all structures
// router.get("/structures/:classId", verifyToken, getFeeStructureById); // Get structure by ID
// router.get("/student/regno/:registrationNumber",verifyToken,getStudentFeeByRegNo); // Get one student’s fee record
// router.get("/all", verifyToken, getAllStudentFees); // Get all student fee records modify required
// router.get("/with-scholarships", verifyToken, getStudentsWithScholarships);
// router.get("/search", verifyToken, searchFees);
// router.put("/structures/:structureId", verifyToken, updateFeeStructure);
// router.delete("/delete/:structureId", verifyToken, deleteFeeStructure);
// router.delete("/remove/scholarship/:registrationNumber/:scholarshipId",verifyToken,removeScholarship);

// export default router;

// //router.post("/assign", verifyToken, assignFeeToStudent);

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
import { authorize } from "../middlewares/authorize.js";
import { schoolContext } from "../middlewares/schoolContext.js";

const router = express.Router();

/* -------------------------------------------------
   GLOBAL PROTECTION FOR FEE MODULE
-------------------------------------------------- */
router.use(verifyToken);
router.use(authorize("admin", "accountant"));
router.use(schoolContext);
// Create & assign fee structure
router.post("/structures", createAndAssignFeeStructure);

// Get all fee structures (school scoped)
router.get("/structures", getFeeStructures);

// Get fee structure by class
router.get("/structures/:classId", getFeeStructureById);

// Update fee structure
router.put("/structures/:structureId", updateFeeStructure);

// Delete fee structure
router.delete("/delete/:structureId", deleteFeeStructure);
// Collect fee
router.post("/collect", collectFee);

// Get all student fees (school scoped)
router.get("/all", getAllStudentFees);

// Get student fee by registration number
router.get("/student/regno/:registrationNumber", getStudentFeeByRegNo);

// Search fees
router.get("/search", searchFees);
// Apply scholarship
router.post("/:registrationNumber/scholarship", applyScholarship);

// Remove scholarship
router.delete(
  "/remove/scholarship/:registrationNumber/:scholarshipId",
  removeScholarship
);

// Students with scholarships
router.get("/with-scholarships", getStudentsWithScholarships);

export default router;
