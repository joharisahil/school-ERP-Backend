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

  // export const createTeacher = async (req, res) => {
  //   try {
  //     if (req.user.role !== "admin") {
  //       return res.status(403).json({ error: "Only admins can register teachers" });
  //     }
  
  //     const { email, password, name, } = req.body;
  
  //     // Create login user for teacher
  //     const user = await User.create({ email, password, role: "teacher" });
  
  //     // Link profile to the logged-in admin (req.user.id!)
  //     const teacher = await Teacher.create({
  //       user: user._id,
  //       admin: req.user.id,
  //       name,
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
  
const generateRegistrationNumber=()=>{
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random()*900);
  return `TID-${timestamp}${random}`;
}

export const createTeacher = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can register teachers" });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      phone2,
      dob,
      address,
      subjects,
      qualifications,
      experienceYears,
    } = req.body;

    const defaultPassword = "teacher@123";
    console.log(firstName,lastName,email,phone,phone2,dob,address,subjects,qualifications,experienceYears);
    // Check if email already exists for a teacher
   
    //Generate unique teacherId
    let registrationNumber;
    let exists = true;
    while (exists) {
      registrationNumber = generateRegistrationNumber(); // string
      exists = await Teacher.findOne({ registrationNumber }); // resolved Promise
    }

    // Create User
    const user = await User.create({ email, password: defaultPassword, role: "teacher" });
  console.log("Step:1", )
    // Create Teacher
    const teacher = await Teacher.create({
      user: user._id,
      admin: req.user.id,
      firstName,
      lastName,
      email,
      phone,
      phone2,
      dob,
      address,
      subjects,
      qualifications,
      experienceYears,
      registrationNumber, // ✅ this is a string now
    });
    console.log("step 2");
    
    res.status(201).json({
      message: "Teacher registered successfully",
      teacher,
      loginCredentials: {
        email,
        password: defaultPassword,
      },
    });

  } catch (error) {
    if (error.code === 11000) {
      console.log(error)
      return res.status(400).json({ error: "Duplicate field found" });
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
  
 
// =========================
// EDIT / UPDATE TEACHER
// =========================
export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params; // teacherId from URL
    const updates = req.body;

    // Prevent updating registrationNumber/email to duplicates
    if (updates.registrationNumber) {
      const exists = await Teacher.findOne({ registrationNumber: updates.registrationNumber, _id: { $ne: id } });
      if (exists) {
        return res.status(400).json({ error: "Registration number already in use" });
      }
    }

    if (updates.email) {
      const exists = await Teacher.findOne({ email: updates.email, _id: { $ne: id } });
      if (exists) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    const teacher = await Teacher.findByIdAndUpdate(id, updates, {
      new: true, // return updated doc
      runValidators: true,
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    res.json({ message: "Teacher updated successfully", teacher });
  } catch (error) {
    console.error("Error updating teacher:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};