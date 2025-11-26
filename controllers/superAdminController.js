import { User } from "../models/userRegisterSchema.js";

export const toggleAdminStatus = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Only Super Admin can perform this action" });
    }

    const adminId = req.params.id;

    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    if (admin.role !== "admin")
      return res.status(400).json({ error: "Target user is not an admin" });

    admin.isActive = !admin.isActive; // toggle
    await admin.save();

    res.json({
      message: `Admin is now ${admin.isActive ? "active" : "disabled"}`,
      isActive: admin.isActive,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};


export const renewPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;  // e.g., 30, 90, 360

    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Only super admin can renew plans" });
    }

    const admin = await User.findById(id);

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    if (admin.role !== "admin")
      return res.status(400).json({ error: "Target is not an admin" });

    admin.planDays += days;              // Add new plan
    admin.isPlanExpired = false;         // Mark as renewed
    admin.isActive = true;               // Activate again

    await admin.save();

    res.json({
      message: "Plan renewed successfully",
      newPlanDays: admin.planDays,
      isActive: admin.isActive
    });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
