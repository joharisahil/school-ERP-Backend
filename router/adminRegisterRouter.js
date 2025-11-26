import express from "express";
import { adminSignIn } from "../controllers/usersController.js";
import {
  adminRegister,
  logout,
  getAdminKPI
} from "../controllers/adminRegisterController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { checkAdminStatus } from "../middlewares/checkAdminStatus.js";
const router = express.Router();

router.post("/signin", checkAdminStatus, adminSignIn);
router.post("/admin", adminRegister);
router.post("/logout", verifyToken, logout);
router.get("/admin/kpi", verifyToken, getAdminKPI);

export default router;
