import jwt from "jsonwebtoken";
import { handleValidationError } from "../middlewares/errorHandler.js";
import { User } from "../models/userRegisterSchema.js";
import { Student, Teacher } from "../models/usersSchema.js";

// Helper: generate JWT
export const generateToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

export const adminSignIn = async (req, res, next) => {
  const { email, password, role } = req.body;
  try {
    if (!email || !password || !role) {
      return handleValidationError("Please provide email and password", 400);
    }

    const existingAdmin = await User.findOne({ email });
    if (!existingAdmin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordValid = await existingAdmin.isValidPassword(password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Generate JWT
    const token = generateToken(existingAdmin);

    // Send token in httpOnly cookie
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production", // set true in production (https)
    //   sameSite: "strict",
    //   maxAge: 24 * 60 * 60 * 1000, // 1 day
    // });

    res.cookie("token", token, {
    httpOnly: true,
    secure: true, // because localhost is not HTTPS
    sameSite: "None", // allow cross-site cookie
    maxAge: 24 * 60 * 60 * 1000,
    });


    res.status(200).json({
      success: true,
      message: "Admin signed in successfully",
      token,
      user: {
        id: existingAdmin._id,
        email: existingAdmin.email,
        role: existingAdmin.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const teacherSignIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: "teacher" });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const ok = await user.isValidPassword(password);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user);
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
      })
      .status(200)
      .json({
        success: true,
        message: "Teacher signed in successfully",
        token,
        user: { id: user._id, email: user.email, role: user.role }
      });
  } catch (err) {
    next(err);
  }
};

export const studentSignIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: "student" });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const ok = await user.isValidPassword(password);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user);
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
      })
      .status(200)
      .json({
        success: true,
        message: "Student signed in successfully",
        token,
        user: { id: user._id, email: user.email, role: user.role }
      });
  } catch (err) {
    next(err);
  }
};
