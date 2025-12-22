// routes/authRoutes.js
import express from "express";
import { signIn , register} from "../controllers/authController.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", signIn);
//router.post("/register", register);

export default router;
