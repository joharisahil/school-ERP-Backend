// routes/accountantRoutes.js
import express from "express";
import {
  createAccountant,
  getAllAccountants,
  updateAccountantModules,
  changeAccountantPassword,
  deleteAccountant,
} from "../controllers/accountantController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorize.js";
const router = express.Router();

// @route   POST /api/accountants
// @desc    Admin creates an accountant
// @access  Private (admin only)
router.post("/register", verifyToken, createAccountant);
router.get(
  "/getall",
  verifyToken,
  authorize("admin"),
  getAllAccountants
);

router.put(
  "/:id/modules",
  verifyToken,
  authorize("admin"),
  updateAccountantModules
);

router.put(
  "/:id/password",
  verifyToken,
  authorize("admin"),
  changeAccountantPassword
);

router.delete(
  "/:id",
  verifyToken,
  authorize("admin"),
  deleteAccountant
);
export default router;
