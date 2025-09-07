import { Subject } from "../models/subjectSchema.js";
import { Teacher } from "../models/teacherSchema.js";
import { Class } from "../models/classSchema.js";

//  Create a Subject
export const createSubject = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create subjects" });
    }

    const { name, code } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ success: false, message: "Name and code are required" });
    }

    const subject = await Subject.create({
      name,
      code,
      admin: req.user.id,
    });

    res.status(201).json({ success: true, message: "Subject created", subject });
  } catch (err) {
    next(err);
  }
};

//  Assign Subject to Teacher
export const assignSubjectToTeacher = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create subjects" });
    }
    
    const { subjectId, teacherId } = req.body;

    const subject = await Subject.findById(subjectId);
    const teacher = await Teacher.findById(teacherId);

    if (!subject || !teacher) {
      return res.status(404).json({ success: false, message: "Subject or Teacher not found" });
    }

    if (!subject.teachers.includes(teacherId)) {
      subject.teachers.push(teacherId);
    }
    await subject.save();

    res.status(200).json({ success: true, message: "Subject assigned to teacher", subject });
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
export const getAllSubjects = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create subjects" });
    }

    const subjects = await Subject.find({ admin: req.user.id })
      .populate("teachers", "name email")
      .populate("classes", "grade section");

    res.status(200).json({ success: true, subjects });
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
    const { subjectId } = req.params;

    await Subject.findByIdAndDelete(subjectId);

    res.status(200).json({ success: true, message: "Subject deleted" });
  } catch (err) {
    next(err);
  }
};
