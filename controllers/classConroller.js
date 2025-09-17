import {  Class } from "../models/classSchema.js";
import { handleValidationError } from "../middlewares/errorHandler.js";
import { Student } from "../models/studentSchema.js";
import { User } from "../models/userRegisterSchema.js";
import fs from "fs";
import csv from "csv-parser";
import bcrypt from "bcryptjs";
import { paginateQuery } from "../utils/paginate.js";

export const createClass = async (req, res, next) => {
  try {
    const { grade, section } = req.body;

    if (!grade || !section) {
      return res.status(400).json({ success: false, message: "Please provide grade and section" });
    }

    const newClass = await Class.create({ grade, section });

    res.status(201).json({
      success: true,
      message: "Class Created!",
      class: newClass,
    });
  } catch (err) {
    next(err);
  }
};


// export const getAllClasses = async (req, res, next) => {
//   try {
//   const classes = await Class.find();
//   res.status(200).json({
//     success: true,
//     classes,
//   });  
//   } catch (err) {
//     next(err);
//   }
// };
 
export const getAllClasses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { results: classes, pagination } = await paginateQuery(
      Class,
      {},
      [], // no populate here, unless you want to add teachers/students later
      page,
      limit
    );

    res.status(200).json({
      success: true,
      classes,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const assignStudentToClass = async (req, res, next) => {
  try {
    const { studentId, classId } = req.body;

    const student = await Student.findById(studentId);
    const classObj = await Class.findById(classId);

    if (!student || !classObj) {
      return res.status(404).json({ success: false, message: "Student or Class not found" });
    }

    // If student is already assigned to a class, prevent reassignment
    if (student.classId) {
      if (student.classId.toString() === classId) {
        return res.status(400).json({
          success: false,
          message: "Student is already assigned to this class",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Student is already assigned to another class",
      });
    }

    // Assign student
    student.classId = classId;
    student.grade = classObj.grade;
    await student.save();

    // Add to class.students if not already present
    if (!classObj.students.includes(studentId)) {
      classObj.students.push(studentId);
      await classObj.save();
    }

    res.status(200).json({
      success: true,
      message: "Student assigned to class",
      student,
    });
  } catch (err) {
    next(err);
  }
};

export const bulkAssignStudents = async (req, res, next) => {
  try {
    const { studentIds, classId } = req.body;

    const classObj = await Class.findById(classId).populate("students", "name");
    if (!classObj) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // 1. Fetch all students
    const students = await Student.find({ _id: { $in: studentIds } }).populate(
      "classId",
      "grade"
    );

    const eligibleStudents = [];
    const skipped = [];

    for (const s of students) {
      if (!s.classId) {
        // Free student → assign
        eligibleStudents.push(s);
      } else if (s.classId._id.toString() === classId) {
        // Already in this class → skip
        skipped.push({
          id: s._id,
          name: s.name,
          currentClass: s.classId.grade,
          reason: "Student is already in this class",
        });
      } else {
        // Assigned to another class → skip
        skipped.push({
          id: s._id,
          name: s.name,
          currentClass: s.classId.grade,
          reason: "Student already assigned to another class",
        });
      }
    }

    // 2. Assign only free students
    if (eligibleStudents.length > 0) {
      await Student.updateMany(
        { _id: { $in: eligibleStudents.map((s) => s._id) } },
        { $set: { classId: classId, grade: classObj.grade } }
      );

      const newStudentIds = eligibleStudents.map((s) => s._id.toString());
      classObj.students = [
        ...new Set([...classObj.students.map((id) => id.toString()), ...newStudentIds]),
      ];
      await classObj.save();
    }

    // 3. Prepare response
    res.status(200).json({
      success: true,
      message: "Bulk assignment completed",
      assigned: eligibleStudents.map((s) => ({ id: s._id, name: s.name })),
      skipped,
    });
  } catch (err) {
    next(err);
  }
};

export const uploadCSV = async (req, res, next) => {
  try {
    const { classId } = req.body;
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const students = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        students.push(row);
      })
      .on("end", async () => {
        const assigned = [];
        const skipped = [];

        for (const studentData of students) {
          try {
            // Check if User already exists for this email
            const existingUser = await User.findOne({ email: studentData.email });
            if (existingUser) {
              skipped.push({
                name: studentData.name,
                email: studentData.email,
                reason: "User with this email already exists",
              });
              continue;
            }

            // Create new User for this student
            const hashedPassword = await bcrypt.hash("student@123", 10); // set default password
            const newUser = await User.create({
              email: studentData.email,
              password: hashedPassword,
              role: "student",
            });

            // Create Student linked with User
            const newStudent = await Student.create({
              user: newUser._id,
              admin: req.user.id, // from token
              name: studentData.name,
              email: studentData.email,
              registrationNumber: studentData.registrationNumber,
              grade: classObj.grade,
              classId: classId,
            });

            // Add student to class
            classObj.students.push(newStudent._id);
            assigned.push({ name: newStudent.name, email: newStudent.email });

          } catch (err) {
            skipped.push({
              name: studentData.name,
              email: studentData.email,
              reason: err.message,
            });
          }
        }

        await classObj.save();

        res.status(200).json({
          success: true,
          message: "CSV upload complete",
          assignedCount: assigned.length,
          skippedCount: skipped.length,
          assigned,
          skipped,
        });
      });
  } catch (err) {
    next(err);
  }
};

