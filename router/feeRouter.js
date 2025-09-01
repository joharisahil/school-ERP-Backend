import express from "express";
import { createFee, getFees, getFeeById, updateFee, deleteFee, payFee, addExtraFee } from "../controllers/feeController.js";

const router = express.Router();

// CRUD routes
router.post("/", createFee);        // Create a new fee record
router.get("/", getFees);           // Get all fee records
router.get("/:id", getFeeById);     // Get fee record by ID
router.put("/:id", updateFee);      // Update fee record
router.delete("/:id", deleteFee);   // Delete fee record

// Payment-specific route
router.post("/:id/pay", payFee);    // Add payment to a student's fee record

router.post("/:id/extra", addExtraFee); // ➝ Add extra fee to existing record

export default router;