
import {Exam} from "../models/examSchema.js";
import { handleValidationError } from "../middlewares/errorHandler.js";

export const addExam = async (req, res, next) => {
  console.log(req.body);
  const { name, registrationNumber, className, marks } = req.body;
  try {
    if (!name || !registrationNumber || !className || !marks) {
        handleValidationError("Please fill out all fields!", 400);
    }
    await Exam.create({ name, registrationNumber, className, marks });
    res.status(200).json({
      success: true,
      message: "A new exam has been added!",
    });
  } catch (err) {
    next(err);
  }
};

export const getAllExams = async (req, res, next) => {
  try {
    const exams = await Exam.find();
    res.status(200).json({
      success: true,
      exams,
    });
  } catch (err) {
    next(err);
  }
};

import { Exam } from "../models/Exam.js";
import { ExamSchedule } from "../models/ExamSchedule.js";

// 1. Create Exam
export const createExam = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create exams" });
    }

    const { name, academicYear, examType, startDate, endDate, description } = req.body;
    
    if (!name || !academicYear || !examType || !startDate || !endDate) {
        handleValidationError("Please fill out all fields!", 400);
    }

    const exam = await Exam.create({
      name,
      academicYear,
      examType,
      startDate,
      endDate,
      description,
      admin: req.user.id
    });

    res.status(201).json({ success: true, message: "Exam created", exam });
  } catch (err) {
    next(err);
  }
};

// 2. Create Exam Schedule
export const createExamSchedule = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create exam schedules" });
    }

    const { exam, classId, subject, date, startTime, endTime, room, maxMarks, invigilator, instructions } = req.body;

    if (!exam || !classId || !subject || !date || !startTime || !endTime) {
        handleValidationError("Please fill out all fields!", 400);
    }

    const schedule = await ExamSchedule.create({
      exam,
      classId,
      subject,
      date,
      startTime,
      endTime,
      room,
      maxMarks,
      invigilator,
      instructions,
      admin: req.user.id
    });

    res.status(201).json({ success: true, message: "Exam schedule created", schedule });
  } catch (err) {
    next(err);
  }
};

// 3. Get list of exam timetables for an exam
export const getExamTimetable = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const schedules = await ExamSchedule.find({ exam: examId })
      .populate("classId", "grade section")
      .populate("subject", "name")
      .populate("invigilator", "name email");

    res.status(200).json({ success: true, schedules });
  } catch (err) {
    next(err);
  }
};

// 4. View exam schedule by ID
export const getExamScheduleById = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await ExamSchedule.findById(scheduleId)
      .populate("exam", "name examType academicYear")
      .populate("classId", "grade section")
      .populate("subject", "name")
      .populate("invigilator", "name email");

    if (!schedule) {
      return res.status(404).json({ error: "Exam schedule not found" });
    }

    res.status(200).json({ success: true, schedule });
  } catch (err) {
    next(err);
  }
};

// 5. Get list of all scheduled exams
export const getAllScheduledExams = async (req, res, next) => {
  try {
    const schedules = await ExamSchedule.find()
      .populate("exam", "name examType academicYear")
      .populate("classId", "grade section")
      .populate("subject", "name")
      .populate("invigilator", "name email");

    res.status(200).json({ success: true, schedules });
  } catch (err) {
    next(err);
  }
};

// auto scheduling for exam (e.g. automatically assigning dates/slots to subjects without teacher conflicts)

// Utility: check if teacher is free for given slot
const isTeacherAvailable = async (teacherId, date, startTime, endTime) => {
  const conflict = await ExamSchedule.findOne({
    invigilator: teacherId,
    date,
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } }
    ]
  });
  return !conflict;
};

// 6. Auto-Schedule Exam
export const autoScheduleExam = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can auto-schedule exams" });
    }

    const { examId, workingDays, dailySlots } = req.body;
    // workingDays = ["2025-10-10", "2025-10-11", "2025-10-12"]
    // dailySlots = [{ start: "09:00", end: "11:00" }, { start: "12:00", end: "14:00" }]

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // fetch all classes and their subjects
    const classes = await Class.find();
    let assigned = [];
    let skipped = [];

    for (const classObj of classes) {
      const subjects = await Subject.find({ classId: classObj._id, admin: req.user.id }).populate("teacher");

      for (const subject of subjects) {
        let scheduled = false;

        for (const day of workingDays) {
          for (const slot of dailySlots) {
            const available = await isTeacherAvailable(subject.teacher._id, day, slot.start, slot.end);
            if (available) {
              const schedule = await ExamSchedule.create({
                exam: examId,
                classId: classObj._id,
                subject: subject._id,
                date: day,
                startTime: slot.start,
                endTime: slot.end,
                maxMarks: 100,
                invigilator: subject.teacher._id,
                admin: req.user.id
              });

              assigned.push({
                class: classObj.grade,
                subject: subject.name,
                teacher: subject.teacher.name,
                date: day,
                start: slot.start,
                end: slot.end
              });

              scheduled = true;
              break;
            }
          }
          if (scheduled) break;
        }

        if (!scheduled) {
          skipped.push({
            class: classObj.grade,
            subject: subject.name,
            teacher: subject.teacher.name,
            reason: "No available slot without conflict"
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Auto-scheduling completed",
      assignedCount: assigned.length,
      skippedCount: skipped.length,
      assigned,
      skipped
    });

  } catch (err) {
    next(err);
  }
};