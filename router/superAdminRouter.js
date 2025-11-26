import express from "express"
import{toggleAdminStatus,renewPlan} from "../controllers/superAdminController.js"
const router = express.Router();

router.patch("/admin/:id/toggle-status",  toggleAdminStatus);

router.patch("/admin/:id/renew-plan", renewPlan);
export default router;