import express from "express";
//import { adminSignIn } from "../controllers/usersController.js";
import {
  adminRegister,
  logout,
  getAdminKPI
} from "../controllers/adminRegisterController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorize.js";
import { schoolContext } from "../middlewares/schoolContext.js";

const router = express.Router();

// router.post("/signin", adminSignIn);
router.post("/admin", adminRegister);
router.post("/logout", verifyToken, logout);
router.get(
  "/admin/kpi",
  verifyToken, 
  authorize("admin", "accountant"),  // ✅ restrict roles
  schoolContext,                     // ✅ attach school/admin context
  getAdminKPI
);


export default router;
