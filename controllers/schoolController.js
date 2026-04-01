// controllers/schoolController.js
import { User } from "../models/userSchema.js";
import fs from "fs";
import path from "path";

// Get School Profile
export const getSchoolProfile = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;

    const user = await User.findById(adminId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "School not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        schoolName: user.schoolName,
        schoolAddress: user.schoolAddress,
        schoolPhone: user.schoolPhone,
        schoolLogo: user.schoolLogo,
        schoolEmail: user.schoolEmail || "",
        email: user.email,
        role: user.role,
        planDays: user.planDays,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching school profile:", error);
    res.status(500).json({ error: "Failed to fetch school profile" });
  }
};

// Update School Profile (Basic Info)
export const updateSchoolProfile = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;
    const { schoolName, schoolAddress, schoolPhone, schoolEmail } = req.body;

    // Update allowed fields
    const updateData = {};
    if (schoolName !== undefined) updateData.schoolName = schoolName;
    if (schoolAddress !== undefined) updateData.schoolAddress = schoolAddress;
    if (schoolPhone !== undefined) updateData.schoolPhone = schoolPhone;
    if (schoolEmail !== undefined) updateData.schoolEmail = schoolEmail;

    const user = await User.findByIdAndUpdate(adminId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "School not found" });
    }

    res.status(200).json({
      success: true,
      message: "School profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating school profile:", error);
    res.status(500).json({ error: "Failed to update school profile" });
  }
};

export const updateSchoolLogo = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Get current user to delete old logo if exists
    const currentUser = await User.findById(adminId);

    // Delete old logo file if it exists and is local file
    if (
      currentUser.schoolLogo &&
      currentUser.schoolLogo.startsWith("/uploads/logos/")
    ) {
      const oldLogoPath = path.join(
  process.cwd(),
  currentUser.schoolLogo.replace("/uploads", "uploads")
);
      if (fs.existsSync(oldLogoPath)) {
        try {
          fs.unlinkSync(oldLogoPath);
        } catch (err) {
          console.error("Error deleting old logo:", err);
        }
      }
    }

    // Generate URL for new logo
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    // Update user with new logo URL
    const user = await User.findByIdAndUpdate(
      adminId,
      { schoolLogo: logoUrl },
      { new: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "School logo updated successfully",
      data: {
        schoolLogo: logoUrl,
        user,
      },
    });
  } catch (error) {
    console.error("Error updating school logo:", error);
    res.status(500).json({ error: "Failed to update school logo" });
  }
};

// Remove School Logo

export const removeSchoolLogo = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;

    const currentUser = await User.findById(adminId);

    // Delete logo file if it exists and is local file
    if (
      currentUser.schoolLogo &&
      currentUser.schoolLogo.startsWith("/uploads/logos/")
    ) {
      const oldLogoPath = path.join(
  process.cwd(),
  currentUser.schoolLogo.replace("/uploads", "uploads")
);
      if (fs.existsSync(oldLogoPath)) {
        try {
          fs.unlinkSync(oldLogoPath);
        } catch (err) {
          console.error("Error deleting logo file:", err);
        }
      }
    }

    // Update user to remove logo
    const user = await User.findByIdAndUpdate(
      adminId,
      { schoolLogo: "" },
      { new: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "School logo removed successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error removing school logo:", error);
    res.status(500).json({ error: "Failed to remove school logo" });
  }
};

// Update School Password
export const updateSchoolPassword = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    const user = await User.findById(adminId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await user.isValidPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
};

// Get School Statistics
export const getSchoolStats = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;
    
    // Import models dynamically to avoid circular dependencies
    const { Student } = await import("../models/studentSchema.js");
    const { Teacher } = await import("../models/teacherSchema.js");
    const { Class } = await import("../models/classSchema.js");
    const { Fee } = await import("../models/feeSchema.js");

    const [studentsCount, teachersCount, classesCount, totalFeesCollected] = await Promise.all([
      Student.countDocuments({ admin: adminId }),
      Teacher.countDocuments({ admin: adminId }),
      Class.countDocuments({ admin: adminId }),
      Fee.aggregate([
        { $match: { admin: adminId } },
        { $group: { _id: null, total: { $sum: "$totalPaid" } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        students: studentsCount,
        teachers: teachersCount,
        classes: classesCount,
        totalFeesCollected: totalFeesCollected[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching school stats:", error);
    res.status(500).json({ error: "Failed to fetch school statistics" });
  }
};