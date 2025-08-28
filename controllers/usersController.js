import jwt from "jsonwebtoken";
import { handleValidationError } from "../middlewares/errorHandler.js";
import { Admin } from "../models/adminRegisterSchema.js";
import { Student, Teacher } from "../models/usersSchema.js";

// Helper: generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role }, // payload
    process.env.SECRET_KEY,
    { expiresIn: "1d" } // token validity
  );
};

export const adminSignIn = async (req, res, next) => {
  const { email, password, role } = req.body;
  try {
    if (!email || !password || !role) {
      return handleValidationError("Please provide email and password", 400);
    }

    const existingAdmin = await Admin.findOne({ email });
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
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // set true in production (https)
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
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

export const studentSignIn = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return handleValidationError("Please provide email and password", 400);
    }

    const existingStudent = await Student.findOne({ email });
    if (
      !existingStudent ||
      !(await existingStudent.isValidPassword(password))
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(existingStudent);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Student signed in successfully",
      user: {
        id: existingStudent._id,
        email: existingStudent.email,
        role: existingStudent.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const teacherSignIn = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return handleValidationError("Please provide email and password", 400);
    }

    const existingTeacher = await Teacher.findOne({ email });
    if (
      !existingTeacher ||
      !(await existingTeacher.isValidPassword(password))
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(existingTeacher);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Teacher signed in successfully",
      user: {
        id: existingTeacher._id,
        email: existingTeacher.email,
        role: existingTeacher.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
