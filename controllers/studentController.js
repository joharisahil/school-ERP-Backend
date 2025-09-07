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

// export const createStudent = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       console.log("admin not found", req.user.role);
//       return res.status(403).json({ error: "Only admins can register students" });
//     }
//     console.log("admin found", req.user.role);
//     const { email, password, name, registrationNumber } = req.body;
//     console.log("User Creation started");
//     const user = await User.create({ email, password, role: "student" });
//     console.log("User Created");
//     const student = await Student.create({
//       user: user._id,
//       admin: req.user.id,
//       name,
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

const generateRegistrationNumber=()=>{
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random()*900);
  return `REG-${timestamp}${random}`;
}

// export const createStudent = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ error: "Only admins can register students" });
//     }
//     console.log("Step1")
//     const {
//       firstName,
//       lastName,
//       email,
//       phone,
//       dob,
//       address,
//       parentEmail,
//       contactPhone,
//       relation,
//     } = req.body;

//     // Default password for all students
//     const defaultPassword = "student@123";

//     // Create login account for student
//     const user = await User.create({
//       email,
//       password: defaultPassword, // ✅ fixed default password
//       role: "student",
//     });

//     let registrationNumber;
//     let exists=true;
//     while(exists){
//       registrationNumber =generateRegistrationNumber();
//       exists= await Student.findOne({registrationNumber});
//     }

//     // Save student details
//     const student = await Student.create({
//       user: user._id,
//       admin: req.user.id,
//       firstName,
//       lastName,
//       email,
//       phone,
//       dob,
//       registrationNumber,
//       address,
//       parentEmail,
//       contactPhone,
//       relation,
//     });

//     res.status(201).json({
//       message: "Student registered successfully",
//       student,
//       loginCredentials: {
//         email,
//         password: defaultPassword, // show admin the password in response
//       },
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res
//         .status(400)
//         .json({ error: "This email/phone already exists for this school" });
//     }
//     res.status(500).json({ error: error.message });
//   }
// };


export const createStudent = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can register students" });
    }
    // console.log("Step1");
    
    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      address,
      contactEmail,   // parent/guardian email
      contactName,    // parent/guardian name
      contactPhone,
      relation,
      fatherName,
      motherName,
      fatherEmail,
      motherEmail,
      fatherOccupation,
      motherOccupation,
      classId,
    } = req.body;

    // Default password for all students
    const defaultPassword = "student@123";

    // Create login account for student
    const user = await User.create({
      email,
      password: defaultPassword,
      role: "student",
    });

    // Ensure unique registration number
    let registrationNumber;
    let exists = true;
    while (exists) {
      registrationNumber = generateRegistrationNumber();
      exists = await Student.findOne({ registrationNumber });
    }

    // Save student details
    const student = await Student.create({
      user: user._id,
      admin: req.user.id,
      firstName,
      lastName,
      email,
      phone,
      dob,
      registrationNumber,
      address,
      classId,
      contactEmail,
      contactName,
      contactPhone,
      relation,
      fatherName,
      motherName,
      fatherEmail,
      motherEmail,
      fatherOccupation,
      motherOccupation,
    });

    res.status(201).json({
      message: "Student registered successfully",
      student,
      loginCredentials: {
        email,
        password: defaultPassword,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "This email/phone already exists for this school" });
    }
    res.status(500).json({ error: error.message });
  }
};



export const getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find()
      .populate("classId"); // fetch full class object

    res.status(200).json({
      success: true,
      students,
    });
  } catch (err) {
    next(err);
  }
};


