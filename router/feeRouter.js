import express from "express";
import {
  createFeeStructure,
  assignFeeToStudent,
  collectFee,
} from "../controllers/feeController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

//
// 1. Fee Structure Setup (Admin only)
//
router.post(
  "/structures",
  verifyToken, // check JWT
  createFeeStructure
);

//
// 2. Assign Fee to Student (Admin only)
//
router.post(
  "/assign",
  verifyToken,
  assignFeeToStudent
);

//
// 3. Collect Fee (Admin only)
//
router.post(
  "/:studentFeeId/pay",
  verifyToken,
  collectFee
);

export default router;
