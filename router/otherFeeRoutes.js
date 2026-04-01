import express from "express";

import {
  createOtherFeeStructure, // Changed from createAndAssignOtherFeeStructure
  applyFeeStructureToStudents, // New controller
  applyFeeStructureToSingleStudent, // New controller
  collectOtherFee,
  updateOtherFeeStructure,
  getStudentOtherFeeByRegNo,
  deleteOtherFeeStructure,
  getAllOtherFeeStructures
} from "../controllers/otherFeeController.js";

import { verifyToken } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorize.js";
import { schoolContext } from "../middlewares/schoolContext.js";

const router = express.Router();    

/* -------------------------------------------------
   GLOBAL PROTECTION FOR OTHER FEE MODULE
-------------------------------------------------- */
router.use(verifyToken);
router.use(authorize("admin", "accountant"));
router.use(schoolContext);

/* -------------------------------------------------
   🏗️ STRUCTURE MANAGEMENT
-------------------------------------------------- */

// Create other fee structure (without assigning to students)
router.post("/structures", createOtherFeeStructure);

// Get all other fee structures
router.get("/structures", getAllOtherFeeStructures);

// Update other fee structure
router.put("/structures/:structureId", updateOtherFeeStructure);

// Delete other fee structure
router.delete("/delete/:structureId", deleteOtherFeeStructure);

/* -------------------------------------------------
   👥 APPLY STRUCTURE TO STUDENTS
-------------------------------------------------- */

// Apply fee structure to multiple students
router.post("/structure/:structureId/apply", applyFeeStructureToStudents);

// Apply fee structure to single student
router.post("/structure/:structureId/student/:studentId/apply", applyFeeStructureToSingleStudent);

/* -------------------------------------------------
   📋 GET ROUTES
-------------------------------------------------- */

// Get student other fee by registration number
router.get(
  "/student/regno/:registrationNumber",
  getStudentOtherFeeByRegNo
);

/* -------------------------------------------------
   💰 PAYMENT
-------------------------------------------------- */

// Collect other fee
router.post("/collect/:studentFeeId", collectOtherFee);

export default router;