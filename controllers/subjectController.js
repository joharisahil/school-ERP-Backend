import { Subject } from "../models/subjectSchema.js";
import { Teacher } from "../models/teacherSchema.js";
import { Class } from "../models/classSchema.js";
import { paginateQuery } from "../utils/paginate.js";

export const createSubject = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create subjects" });
    }

    const { name, code, classIds, teacherIds } = req.body; // classIds is now an array

    if (!name || !classIds || classIds.length === 0) {
      return res.status(400).json({ error: "Name and at least one class are required" });
    }

    // Validate all class IDs belong to this admin
    const validClasses = await Class.find({
      _id: { $in: classIds },
      admin: req.user.id,
    });
    if (validClasses.length !== classIds.length) {
      return res.status(400).json({ error: "Some classes not found under your account" });
    }

    // Validate all teachers
    let validTeacherIds = [];
    if (teacherIds && teacherIds.length > 0) {
      const teachers = await Teacher.find({
        _id: { $in: teacherIds },
        admin: req.user.id,
      });
      if (teachers.length !== teacherIds.length) {
        return res.status(400).json({ error: "Some teachers not found under your account" });
      }
      validTeacherIds = teachers.map(t => t._id);
    }

    // Check for duplicate code under the same admin
    const existingSubject = await Subject.findOne({ admin: req.user.id, code });
    if (existingSubject) {
      return res.status(400).json({ error: "Subject code already exists under your account" });
    }

    // Create subject
    const subject = await Subject.create({
      name,
      code,
      admin: req.user.id,
      classes: classIds, // ✅ multiple classes supported now
      teachers: validTeacherIds,
    });

    res.status(201).json({
      message: "Subject created successfully",
      subject,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Duplicate subject code under this admin" });
    }
    res.status(500).json({ error: error.message });
  }
};


//  Assign Subject to Teacher
// export const assignSubjectToTeacher = async (req, res, next) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ error: "Only admins can create subjects" });
//     }
    
//     const { subjectId, teacherId } = req.body;

//     const subject = await Subject.findById(subjectId);
//     const teacher = await Teacher.findById(teacherId);

//     if (!subject || !teacher) {
//       return res.status(404).json({ success: false, message: "Subject or Teacher not found" });
//     }

//     if (!subject.teachers.includes(teacherId)) {
//       subject.teachers.push(teacherId);
//     }
//     await subject.save();

//     res.status(200).json({ success: true, message: "Subject assigned to teacher", subject });
//   } catch (err) {
//     next(err);
//   }
// };

export const toggleSubjectTeacherAssignment = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can assign/unassign subjects" });
    }

    const { subjectId, teacherId } = req.body;

    const subject = await Subject.findById(subjectId);
    const teacher = await Teacher.findById(teacherId);

    if (!subject || !teacher) {
      return res.status(404).json({ success: false, message: "Subject or Teacher not found" });
    }

    let action = '';

    if (subject.teachers.includes(teacherId)) {
      // Teacher already assigned → remove (unassign)
      subject.teachers = subject.teachers.filter(id => id.toString() !== teacherId);
      action = 'unassigned';
    } else {
      // Teacher not assigned → add (assign)
      subject.teachers.push(teacherId);
      action = 'assigned';
    }

    await subject.save();

    res.status(200).json({ 
      success: true, 
      message: `Teacher successfully ${action} to subject`, 
      subject 
    });
  } catch (err) {
    next(err);
  }
};

//  Assign Subject to Class
export const assignSubjectToClass = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create subjects" });
    }

    const { subjectId, classId } = req.body;

    const subject = await Subject.findById(subjectId);
    const classObj = await Class.findById(classId);

    if (!subject || !classObj) {
      return res.status(404).json({ success: false, message: "Subject or Class not found" });
    }

    if (!subject.classes.includes(classId)) {
      subject.classes.push(classId);
    }
    await subject.save();

    res.status(200).json({ success: true, message: "Subject assigned to class", subject });
  } catch (err) {
    next(err);
  }
};

//  Get All Subjects (with teachers & classes)
// export const getAllSubjects = async (req, res, next) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ error: "Only admins can view subjects" });
//     }

//     // Defaults: page=1, limit=10
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     // Fetch subjects with pagination
//     const subjects = await Subject.find({ admin: req.user.id })
//       .populate("teachers", "name email")
//       .populate("classes", "grade section")
//       .skip(skip)
//       .limit(limit);

//     // Count total subjects for this admin
//     const totalSubjects = await Subject.countDocuments({ admin: req.user.id });

//     res.status(200).json({
//       success: true,
//       subjects,
//       pagination: {
//         totalSubjects,
//         currentPage: page,
//         totalPages: Math.ceil(totalSubjects / limit),
//         limit,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

export const getAllSubjects = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can view subjects" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { results: subjects, pagination } = await paginateQuery(
      Subject,
      { admin: req.user.id },
      [
        { path: "teachers", select: "name email" },
        { path: "classes", select: "grade section" },
      ],
      page,
      limit
    );

    res.status(200).json({
      success: true,
      subjects,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};


//  Get Subjects by Teacher
export const getSubjectsByTeacher = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create subjects" });
    }

    const { teacherId } = req.params;

    const subjects = await Subject.find({ teachers: teacherId })
      .populate("classes", "grade section");

    res.status(200).json({ success: true, subjects });
  } catch (err) {
    next(err);
  }
};

//  Get Subjects by Class
export const getSubjectsByClass = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create subjects" });
    }

    const { classId } = req.params;

    const subjects = await Subject.find({ classes: classId })
      .populate("teachers", "name email");

    res.status(200).json({ success: true, subjects });
  } catch (err) {
    next(err);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
     if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create subjects" });
    }
    const { subjectId } = req.params;

    await Subject.findByIdAndDelete(subjectId);

    res.status(200).json({ success: true, message: "Subject deleted" });
  } catch (err) {
    next(err);
  }
};
