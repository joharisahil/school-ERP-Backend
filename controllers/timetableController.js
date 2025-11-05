import { Period } from "../models/timetableSchema.js";
import { Teacher } from "../models/teacherSchema.js";
import { Subject } from "../models/subjectSchema.js";
import { Class } from "../models/classSchema.js";

// ✅ Create/Assign a period
export const createPeriod = async (req, res, next) => {
  try {
    const { day, periodNumber, classId, subjectId, teacherId } = req.body;

    // check class, subject, teacher exist
    const [classObj, subject, teacher] = await Promise.all([
      Class.findById(classId),
      Subject.findById(subjectId),
      Teacher.findById(teacherId),
    ]);

    if (!classObj || !subject || !teacher) {
      return res.status(404).json({ error: "Class/Subject/Teacher not found" });
    }

    // ensure teacher is assigned subject
    if (!subject.teachers?.some(t => t.toString() === teacherId)) {
      return res.status(400).json({ error: "This teacher is not assigned to this subject" });
    }

    // create period
    const period = await Period.create({ day, periodNumber, classId, subjectId, teacherId });

    res.status(201).json({ success: true, message: "Period created", period });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Teacher already assigned in this slot" });
    }
    next(err);
  }
};

//  Auto-generate timetable for a class
export const autoGenerateTimetable = async (req, res, next) => {
  try {
    const { classId, days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], periodsPerDay = 6 } = req.body;

    const classObj = await Class.findById(classId);
    if (!classObj) return res.status(404).json({ error: "Class not found" });

    const subjects = await Subject.find({ classId }).populate("teachers");
    if (subjects.length === 0) return res.status(400).json({ error: "No subjects assigned to this class" });

    const createdPeriods = [];

    let periodCounter = 0;
    for (const day of days) {
      for (let p = 1; p <= periodsPerDay; p++) {
        const subject = subjects[periodCounter % subjects.length];
        if (!subject.teachers) continue;

        // avoid teacher conflict
        const conflict = await Period.findOne({
          day,
          periodNumber: p,
          $or: [
            { teacherId: subject.teachers._id },
            { classId }
          ]
        });

        if (conflict) continue;

        const period = await Period.create({
          day,
          periodNumber: p,
          classId,
          subjectId: subject._id,
          teacherId: subject.teachers._id,
        });

        createdPeriods.push(period);
        periodCounter++;
      }
    }

    res.status(201).json({ success: true, message: "Timetable auto-generated", created: createdPeriods.length });
  } catch (err) {
    next(err);
  }
};

// ✅ Get class timetable
export const getClassTimetable = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const timetable = await Period.find({ classId })
      .populate("subjectId", "name code")
      .populate("teacherId", "firstName lastName email")
      .sort({ day: 1, periodNumber: 1 });

    res.status(200).json({ success: true, timetable });
  } catch (err) {
    next(err);
  }
};

// ✅ Get teacher timetable
export const getTeacherTimetable = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const timetable = await Period.find({ teacherId })
      .populate("subjectId", "name code")
      .populate("classId", "grade section")
      .sort({ day: 1, periodNumber: 1 });

    res.status(200).json({ success: true, timetable });
  } catch (err) {
    next(err);
  }
};

// ✅ Find free teachers for substitution
export const getFreeTeachers = async (req, res, next) => {
  try {
    const { day, periodNumber } = req.body;

    //  Get logged-in admin from token
    const adminId = req.user.id;

    // Find busy teachers for that day and period
    const busyTeachers = await Period.find({ day, periodNumber }).distinct("teacherId");

    // Find teachers belonging to this admin and not busy
    const freeTeachers = await Teacher.find({
      admin: adminId,
      _id: { $nin: busyTeachers },
    });

    res.status(200).json({
      success: true,
      count: freeTeachers.length,
      freeTeachers,
    });
  } catch (err) {
    next(err);
  }
};


export const getPeriodByClassDayPeriod = async (req, res, next) => {
  try {
    const { classId, day, periodNumber } = req.params;

    const period = await Period.findOne({ classId, day, periodNumber })
      .populate("subjectId", "name code")
      .populate("teacherId", "firstName lastName email");

    if (!period) {
      return res.status(404).json({ success: false, message: "No period found for this slot" });
    }

    res.status(200).json({ success: true, period });
  } catch (err) {
    next(err);
  }
};



// Update a specific period in a class timetable
export const updatePeriod = async (req, res, next) => {
  try {
    const { periodId } = req.params;
    const { day, periodNumber, classId, subjectId, teacherId, room } = req.body;

    // 🔍 Conflict checks
    const teacherConflict = await Period.findOne({
      _id: { $ne: periodId },
      day,
      periodNumber,
      teacherId,
    });

    if (teacherConflict) {
      return res.status(400).json({
        success: false,
        message: "Teacher is already assigned in another class at this time",
      });
    }

    const classConflict = await Period.findOne({
      _id: { $ne: periodId },
      day,
      periodNumber,
      classId,
    });

    if (classConflict) {
      return res.status(400).json({
        success: false,
        message: "This class already has another subject in this period",
      });
    }

    // ✅ Update the period
    const updated = await Period.findByIdAndUpdate(
      periodId,
      { day, periodNumber, classId, subjectId, teacherId, room },
      { new: true }
    )
      .populate("subjectId", "name code")
      .populate("teacherId", "firstName lastName");

    if (!updated)
      return res.status(404).json({ success: false, message: "Period not found" });

    res.status(200).json({ success: true, message: "Period updated successfully", period: updated });
  } catch (err) {
    next(err);
  }
};
