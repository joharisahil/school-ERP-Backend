import { User } from "../models/userRegisterSchema.js";
import { handleValidationError } from "../middlewares/errorHandler.js";


export const adminRegister = async (req, res, next) => {
  console.log(req.body);
  const { email, password, role } = req.body;
  try {
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Please Fill Form!" });
      handleValidationError("Please Fill Form!", 400);
    }

    // Check if an admin with the same email already exists
    const existingAdmin = await User.findOne({ email, role: "admin" });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin already exists" });
    }

    await User.create({ email, password, role });
    res.status(200).json({
      success: true,
      message: "Admin Created!",
    });
  } catch (err) {
    next(err);
  }
};

// export const registerTeacher = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ error: "Only admins can register teachers" });
//     }

//     const { email, password, name, subject } = req.body;

//     // Create login user for teacher
//     const user = await User.create({ email, password, role: "teacher" });

//     // Link profile to the logged-in admin (req.user.id!)
//     const teacher = await Teacher.create({
//       user: user._id,
//       admin: req.user.id,
//       name,
//       subject,
//       email,
//     });

//     res.status(201).json({ message: "Teacher registered successfully", teacher });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ error: "This email is already registered for this school" });
//     }
//     res.status(500).json({ error: error.message });
//   }
// };

// export const registerStudent = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       console.log("admin not found", req.user.role);
//       return res.status(403).json({ error: "Only admins can register students" });
//     }
//     console.log("admin found", req.user.role);
//     const { email, password, name, grade, registrationNumber } = req.body;
//     console.log("User Creation started");
//     const user = await User.create({ email, password, role: "student" });
//     console.log("User Created");
//     const student = await Student.create({
//       user: user._id,
//       admin: req.user.id,
//       name,
//       grade,
//       email,
//       registrationNumber,
//     });
//     console.log("User added in student")
//     res.status(201).json({ message: "Student registered successfully", student });
//   } catch (error) {
//     console.log("we are here in catch", error)
//     if (error.code === 11000) {
//       return res.status(400).json({ error: "This email/registration already exists for this school" });
//     }
//     res.status(500).json({ error: error.message });
//   }
// };

// controllers/authController.js

export const logout = async (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};
