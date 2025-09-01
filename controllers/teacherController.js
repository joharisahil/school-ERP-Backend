import { Teacher } from "../models/teacherSchema.js";
import { User } from "../models/userRegisterSchema.js";
import { handleValidationError } from "../middlewares/errorHandler.js";

//  export const createTeacher = async (req, res, next) => {
//   console.log(req.body);
//     const { name, email, subject } = req.body;
//     try {
//          if (!name || !email || !subject ) {
//           handleValidationError("Please Fill Full Form!", 400);
//     }
//     await Teacher.create({ name, email, subject });
//     res.status(200).json({
//       success: true,
//       message: "Teacher Created!",
//     }); 
//     } catch (err) {
//       next(err)
//     }
//   };

  export const createTeacher = async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can register teachers" });
      }
  
      const { email, password, name, subject } = req.body;
  
      // Create login user for teacher
      const user = await User.create({ email, password, role: "teacher" });
  
      // Link profile to the logged-in admin (req.user.id!)
      const teacher = await Teacher.create({
        user: user._id,
        admin: req.user.id,
        name,
        subject,
        email,
      });
  
      res.status(201).json({ message: "Teacher registered successfully", teacher });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ error: "This email is already registered for this school" });
      }
      res.status(500).json({ error: error.message });
    }
  };
  

  export const getAllTeachers = async (req, res, next) => {
    try {
     const teachers = await Teacher.find();
    res.status(200).json({
      success: true,
      teachers,
    });   
    } catch (err) {
      next(err)
    }
  };
  
 
