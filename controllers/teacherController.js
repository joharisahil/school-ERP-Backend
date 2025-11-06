import { Teacher } from "../models/teacherSchema.js";
import { User } from "../models/userRegisterSchema.js";
import { paginateQuery } from "../utils/paginate.js";
import { Subject } from "../models/subjectSchema.js";
import XLSX from "xlsx";

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
    //console.log(firstName,lastName,email,phone,phone2,dob,address,subjects,qualifications,experienceYears);
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
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can register teachers" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { results: teachers, pagination } = await paginateQuery(
      Teacher,
      {admin: req.user.id},
      [],
      page,
      limit
    );

    res.status(200).json({
      success: true,
      teachers,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};
 
// =========================
// EDIT / UPDATE TEACHER
// =========================
export const updateTeacher = async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can register teachers" });
    }
    
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


export const getTeachersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId).populate("teachers");

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const teachers = subject.teachers.map((t) => ({
      _id: t._id,
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      subjects: t.subjects,
    }));

    res.status(200).json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers by subject:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    if (teacher.isDeleted) {
      return res.status(400).json({ success: false, message: "Teacher already deleted" });
    }

    teacher.isDeleted = true;
    teacher.deletedAt = new Date();
    await teacher.save();

    res.status(200).json({ success: true, message: "Teacher soft deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const uploadTeachersExcel = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can upload teachers" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Please upload an Excel file" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const defaultPassword = "teacher@123";
    const results = { success: [], failed: [] };

    for (const row of rows) {
      try {
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
        } = row;

        // ✅ Mandatory checks
        if (!firstName || !email || !phone || !address || experienceYears === undefined) {
          results.failed.push({
            row,
            reason: "Missing required fields (*firstName, *email, *phone, *address, *experienceYears)",
          });
          continue;
        }

        // ✅ Check duplicate teacher for same admin
        const duplicate = await Teacher.findOne({
          email,
          admin: req.user.id,
          isDeleted: false,
        });

        if (duplicate) {
          results.failed.push({ row, reason: "Duplicate teacher email under this admin" });
          continue;
        }

        // ✅ Generate unique registration number
        let registrationNumber;
        let exists = true;
        while (exists) {
          registrationNumber = generateRegistrationNumber();
          exists = await Teacher.findOne({ registrationNumber });
        }

        // ✅ Create user login
        const user = await User.create({
          email,
          password: defaultPassword,
          role: "teacher",
        });

        // ✅ Create teacher record
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
          subjects: subjects ? subjects.split(",").map((s) => s.trim()) : [],
          qualifications: qualifications ? qualifications.split(",").map((q) => q.trim()) : [],
          experienceYears,
          registrationNumber,
        });

        results.success.push({
          name: `${firstName} ${lastName || ""}`.trim(),
          email,
          registrationNumber,
        });
      } catch (err) {
        console.error("❌ Error creating teacher from Excel:", err.message);
        results.failed.push({ row, reason: err.message });
      }
    }

    res.status(200).json({
      message: "Teacher Excel upload completed",
      summary: {
        total: rows.length,
        success: results.success.length,
        failed: results.failed.length,
      },
      results,
    });
  } catch (error) {
    console.error("Error uploading teachers Excel:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};