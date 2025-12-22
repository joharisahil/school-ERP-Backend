// controllers/accountantController.js
import { User } from "../models/userSchema.js";
import bcrypt from "bcrypt";

// Admin creates an accountant
export const createAccountant = async (req, res, next) => {
  try {
    const adminId = req.user.id; // Admin is authenticated; get id from JWT
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    // Hash password
   // const hashedPassword = await bcrypt.hash(password, 10);

    // Create accountant and link to admin/school
    const accountant = await User.create({
      email,
      password,
      role: "accountant",
      schoolId: adminId, // link to the school/admin
      allowedModules: req.body.allowedModules || [], // admin can assign later
    });

    res.status(201).json({
      success: true,
      message: "Accountant created successfully",
      user: {
        id: accountant._id,
        email: accountant.email,
        role: accountant.role,
        schoolId: accountant.schoolId,
        allowedModules: accountant.allowedModules,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Get all accountants for logged-in admin
 * GET /accountants/getall
 */
export const getAllAccountants = async (req, res, next) => {
  try {
    const adminId = req.user.id;

    const accountants = await User.find({
      role: "accountant",
      schoolId: adminId,
    }).select("-password");

    res.status(200).json({
      success: true,
      count: accountants.length,
      data: accountants,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Update accountant allowed modules
 * PUT /accountants/:id/modules
 */
export const updateAccountantModules = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { modules } = req.body;

    const accountant = await User.findOne({
      _id: id,
      role: "accountant",
      schoolId: adminId,
    });

    if (!accountant) {
      return res.status(404).json({
        success: false,
        message: "Accountant not found",
      });
    }

    accountant.allowedModules = modules;
    await accountant.save();

    res.status(200).json({
      success: true,
      message: "Modules updated successfully",
      data: accountant,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Change accountant password
 * PUT /accountants/:id/password
 */
export const changeAccountantPassword = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const accountant = await User.findOne({
      _id: id,
      role: "accountant",
      schoolId: adminId,
    });

    if (!accountant) {
      return res.status(404).json({
        success: false,
        message: "Accountant not found",
      });
    }

    accountant.password = await bcrypt.hash(password, 10);
    await accountant.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Delete accountant
 * DELETE /accountants/:id
 */
export const deleteAccountant = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const accountant = await User.findOneAndDelete({
      _id: id,
      role: "accountant",
      schoolId: adminId,
    });

    if (!accountant) {
      return res.status(404).json({
        success: false,
        message: "Accountant not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Accountant deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};