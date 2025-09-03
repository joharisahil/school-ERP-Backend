import { Student } from "../models/studentSchema.js";
import { User } from "../models/userRegisterSchema.js";
import { handleValidationError } from "../middlewares/errorHandler.js";

// export const createStudent = async (req, res, next) => {
//   console.log(req.body);
//   const { name, registrationNumber, grade } = req.body;
//   try {
//    if (!name || !registrationNumber || !grade ) {
//     return next("Please Fill Full Form!", 400);
//   }
//   await Student.create({ name, registrationNumber, grade });
//   res.status(200).json({
//     success: true,
//     message: "Student Created!",
//   });   
// } catch (err) {
//   next(err);
// } 
// };

export const createStudent = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      console.log("admin not found", req.user.role);
      return res.status(403).json({ error: "Only admins can register students" });
    }
    console.log("admin found", req.user.role);
    const { email, password, name, registrationNumber } = req.body;
    console.log("User Creation started");
    const user = await User.create({ email, password, role: "student" });
    console.log("User Created");
    const student = await Student.create({
      user: user._id,
      admin: req.user.id,
      name,
      email,
      registrationNumber,
    });
    console.log("User added in student")
    res.status(201).json({ message: "Student registered successfully", student });
  } catch (error) {
    console.log("we are here in catch", error)
    if (error.code === 11000) {
      return res.status(400).json({ error: "This email/registration already exists for this school" });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getAllStudents = async (req, res, next) => {
  try {
   const students = await Student.find();
  res.status(200).json({
    success: true,
    students,
  });   
} catch (err) {
  next(err);
}
};



