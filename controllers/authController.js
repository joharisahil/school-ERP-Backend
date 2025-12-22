// controllers/authController.js
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";
import { handleValidationError } from "../middlewares/errorHandler.js";
import bcrypt from "bcrypt";


// Helper: generate JWT
// Helper: generate JWT
// Helper: generate JWT
export const generateToken = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    allowedModules: user.allowedModules,
  };

  // ✅ Include schoolId for accountant
  if (user.role === "accountant" && user.schoolId) {
    payload.schoolId = user.schoolId.toString();
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
};



// Generic sign-in for all roles
export const signIn = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    // ✅ Only email & password required
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    email = email.trim().toLowerCase();

    // ✅ Find user ONLY by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ✅ Password check
    const isValid = await user.isValidPassword(password);
    //console.log(await user.isValidPassword("admin123"));

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ✅ Role-based restrictions (SAFE now)

    if (user.role === "admin" && user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Admin account is disabled",
      });
    }

    // if (
    //   user.role === "accountant" &&
    //   (!user.allowedModules || user.allowedModules.length === 0)
    // ) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Accountant account has no access modules assigned",
    //   });
    // }

    // superadmin → no restrictions

    const token = generateToken(user);

    // ✅ Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} signed in successfully`,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        allowedModules: user.allowedModules,
      },
    });
  } catch (err) {
    next(err);
  }
};


// controllers/authController.js

// Register a new user (Admin or Accountant)
//.............>>>>>>>>><<<<<<<<<<<<<................
//not in use for now so can be removed safely

export const register = async (req, res, next) => {
  try {
    const { email, password, role, schoolName, planDays, schoolId } = req.body;

    // Basic validation
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: "Email, password, and role are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Role-specific checks
    if (role === "admin") {
      if (!schoolName || !planDays) {
        return res.status(400).json({ success: false, message: "Admin must have schoolName and planDays" });
      }
    }

    if (role === "accountant") {
      if (!schoolId) {
        return res.status(400).json({ success: false, message: "Accountant must be linked to a school (schoolId)" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role,
      schoolName: role === "admin" ? schoolName : undefined,
      planDays: role === "admin" ? planDays : undefined,
      schoolId: role === "accountant" ? schoolId : undefined,
      allowedModules: role === "admin" ? ["*"] : [],
    });

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        schoolName: newUser.schoolName,
        allowedModules: newUser.allowedModules,
      },
    });
  } catch (err) {
    next(err);
  }
};
