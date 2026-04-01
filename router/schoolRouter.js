// routes/schoolRoutes.js
import express from "express";
import {
  getSchoolProfile,
  updateSchoolProfile,
  updateSchoolLogo,
  removeSchoolLogo,
  updateSchoolPassword,
  getSchoolStats
  
} from "../controllers/schoolController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorize.js";
import { schoolContext } from "../middlewares/schoolContext.js";
import { uploadLogo } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// ============================================
// GLOBAL MIDDLEWARE (Applied to all routes)
// ============================================
router.use(verifyToken);
router.use(schoolContext);
router.use(authorize("admin", "accountant")); // ✅ Single declaration for all routes

// ============================================
// SCHOOL MANAGEMENT ROUTES
// ============================================

// Get school profile
router.get("/profile", getSchoolProfile);

// Update school profile (basic info)
router.put("/profile", updateSchoolProfile);

// Update school logo (with file upload middleware)
router.post("/logo", uploadLogo, updateSchoolLogo);

// Remove school logo
router.delete("/logo", removeSchoolLogo);

// Update school password
router.put("/password", updateSchoolPassword);

// Get school statistics
router.get(
  "/stats",
 
  getSchoolStats
);


export default router;