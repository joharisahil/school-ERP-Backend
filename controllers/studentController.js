import { Student } from "../models/studentSchema.js";
import { User } from "../models/userRegisterSchema.js";
import { paginateQuery } from "../utils/paginate.js";
import { Class } from "../models/classSchema.js"; // adjust the path if needed
import mongoose from "mongoose";
import { StudentFee } from "../models/studentFeeSchema.js";
import { FeeStructure } from "../models/feeStructureSchema.js";


const generateRegistrationNumber = () => {
  const timestamp = Date.now().toString().slice(-2);
  const random = Math.floor(100 + Math.random() * 900);
  return `REG-${timestamp}${random}`;
};

// export const createStudent = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res
//         .status(403)
//         .json({ error: "Only admins can register students" });
//     }

//     const {
//       firstName,
//       lastName,
//       email,
//       phone,
//       dob,
//       address,
//       contactEmail,
//       contactName,
//       contactPhone,
//       relation,
//       fatherName,
//       motherName,
//       fatherphone,
//       motherphone,
//       fatherEmail,
//       motherEmail,
//       fatherOccupation,
//       motherOccupation,
//       classId,
//     } = req.body;

//     const defaultPassword = "student@123";

//     // Create login account for student
//     const user = await User.create({
//       email,
//       password: defaultPassword,
//       role: "student",
//     });

//     // Ensure unique registration number
//     let registrationNumber;
//     let exists = true;
//     while (exists) {
//       registrationNumber = generateRegistrationNumber();
//       exists = await Student.findOne({ registrationNumber });
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
//       classId,
//       contactEmail,
//       contactName,
//       contactPhone,
//       relation,
//       fatherName,
//       motherName,
//       fatherphone,
//       motherphone,
//       fatherEmail,
//       motherEmail,
//       fatherOccupation,
//       motherOccupation,
//     });

//     // ✅ Add student to Class
//     await Class.findByIdAndUpdate(classId, {
//       $push: { students: student._id },
//     });

//     res.status(201).json({
//       message: "Student registered successfully",
//       student,
//       loginCredentials: {
//         email,
//         password: defaultPassword,
//       },
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({
//         error:
//           "Student with this email or registration number already exists under your account",
//       });
//     }
//     res.status(500).json({ error: error.message });
//   }
// };


const generateStudentEmail = (firstName, lastName, registrationNumber, schoolName) => {
  const cleanFirstName = firstName.toLowerCase().replace(/\s+/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/\s+/g, '');
  const cleanSchoolName = schoolName.toLowerCase().replace(/\s+/g, '');

  // remove "REG-" before using in email
  const regNoPart = registrationNumber.replace(/^REG-/, '');

  return `${cleanFirstName}${cleanLastName}${regNoPart}@${cleanSchoolName}.jam`;
};

// ===== Main Controller =====
export const createStudent = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can register students" });
    }

    const {
      firstName,
      lastName,
      phone,
      dob,
      address,
      contactEmail,
      contactName,
      contactPhone,
      relation,
      fatherName,
      motherName,
      fatherphone,
      motherphone,
      fatherEmail,
      motherEmail,
      fatherOccupation,
      motherOccupation,
      classId,
      session, // ✅ Make sure session is passed from frontend
    } = req.body;

    // ✅ Static school name variable
    const schoolName = "JamAcademy";

    const defaultPassword = "student@123";

    // ✅ Generate unique registration number
    let registrationNumber;
    let exists = true;
    while (exists) {
      registrationNumber = generateRegistrationNumber();
      exists = await Student.findOne({ registrationNumber });
    }

    // ✅ Generate student email
    const studentEmail = generateStudentEmail(
      firstName,
      lastName,
      registrationNumber,
      schoolName
    );

    // ✅ Create login user for student
    const user = await User.create({
      email: studentEmail,
      password: defaultPassword,
      role: "student",
    });
    

    // ✅ Save student record
    const student = await Student.create({
      user: user._id,
      admin: req.user.id,
      firstName,
      lastName,
      email: studentEmail,
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
      fatherphone,
      motherphone,
      fatherEmail,
      motherEmail,
      fatherOccupation,
      motherOccupation,
    });

    // ✅ Add student to Class
    await Class.findByIdAndUpdate(classId, {
      $push: { students: student._id },
    });

    // ✅ Auto-Assign Fee Structure if available
    const existingStructure = await FeeStructure.findOne({ classId, session });

    if (existingStructure) {
      const installments = existingStructure.monthDetails.map((m) => ({
        month: m.month,
        dueDate: m.dueDate,
        amount: m.amount,
        status: "Pending",
        amountPaid: 0,
      }));

      const totalAmount = installments.reduce(
        (sum, inst) => sum + inst.amount,
        0
      );

      const studentFee = await StudentFee.create({
        studentId: student._id,
        registrationNumber: student.registrationNumber,
        classId,
        session,
        structureId: existingStructure._id,
        totalAmount,
        netPayable: totalAmount,
        totalPaid: 0,
        balance: totalAmount,
        installments,
        createdBy: req.user.id,
      });

      console.log(`✅ Fee structure auto-assigned to ${student.firstName}`);
    } else {
      console.log(
        `⚠️ No Fee Structure found for class ${classId} (session ${session})`
      );
    }

    res.status(201).json({
      message: "Student registered successfully",
      student,
      loginCredentials: {
        email: studentEmail,
        password: defaultPassword,
      },
    });
  } catch (error) {
    console.error("Error creating student:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        error:
          "Student with this email or registration number already exists under your account",
      });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getAllStudents = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can view this data" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Fetch all students for pagination
    const { results: students, pagination } = await paginateQuery(
      Student,
      { admin: req.user.id },
      [{ path: "classId" }],
      page,
      limit
    );

    // Get all student IDs
    const studentIds = students.map((s) => s._id);

    // Find student fees that have scholarships for these students
    const studentFees = await StudentFee.find({
      studentId: { $in: studentIds },
      "scholarships.0": { $exists: true },
    })
      .populate("studentId", "firstName lastName rollNo classId")
      .populate("classId", "name")
      .populate(
        "structureId",
        "session totalAmount amountPerInstallment scholarships"
      );

    // Map scholarships by studentId for quick lookup
    const scholarshipMap = {};
    studentFees.forEach((fee) => {
      scholarshipMap[fee.studentId._id] = {
        scholarships: fee.scholarships,
        totalAmount: fee.structureId?.totalAmount || 0,
        session: fee.structureId?.session || "N/A",
        amountPerInstallment: fee.structureId?.amountPerInstallment || 0,
        createdAt: fee.createdAt,
        updatedAt: fee.updatedAt,
      };
    });

    // Merge scholarship info into students
    const mergedStudents = students.map((student) => ({
      ...student.toObject(),
      scholarshipInfo: scholarshipMap[student._id] || null,
    }));

    // Count total scholarship students
    const totalScholarshipStudents = studentFees.length;
    const totalStudents = await Student.countDocuments({ admin: req.user.id });

    // Calculate percentage
    const scholarshipPercentage =
      totalStudents > 0
        ? ((totalScholarshipStudents / totalStudents) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      totalStudents,
      totalScholarshipStudents,
      scholarshipPercentage: `${scholarshipPercentage}%`,
      students: mergedStudents,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const updateStudent = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can register students" });
    }

    const { id } = req.params; // studentId from URL
    const updates = req.body;

    // Prevent duplicate registrationNumber
    if (updates.registrationNumber) {
      const exists = await Student.findOne({
        registrationNumber: updates.registrationNumber,
        _id: { $ne: id },
      });
      if (exists) {
        return res
          .status(400)
          .json({ error: "Registration number already in use" });
      }
    }

    // Prevent duplicate email for this admin
    if (updates.email) {
      const exists = await Student.findOne({
        email: updates.email,
        admin: req.user._id, // assuming admin logged in
        _id: { $ne: id },
      });
      if (exists) {
        return res
          .status(400)
          .json({ error: "Email already in use under this admin" });
      }
    }

    const student = await Student.findByIdAndUpdate(id, updates, {
      new: true, // return updated document
      runValidators: true, // apply schema validation
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ message: "Student updated successfully", student });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteStudent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Only admins can delete students
    if (req.user.role !== "admin") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ error: "Only admins can delete students" });
    }

    const { id } = req.params;

    // 1️⃣ Find the student
    const student = await Student.findById(id).session(session);
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Student not found" });
    }

    // 2️⃣ Remove student reference from class
    if (student.classId) {
      await Class.updateOne(
        { _id: student.classId },
        { $pull: { students: student._id } },
        { session }
      );
    }

    // 3️⃣ Delete all related fee records
    await StudentFee.deleteMany({ studentId: id }, { session });

    // 4️⃣ Delete the student itself
    await Student.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "✅ Student and all related records deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error deleting student:", error);
    return res
      .status(500)
      .json({ error: "Server error while deleting student" });
  }
};
