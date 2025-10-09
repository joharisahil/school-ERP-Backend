import mongoose from "mongoose";

const examScheduleSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String, // HH:mm
    required: true,
  },
  endTime: {
    type: String, // HH:mm
    required: true,
  },
  room: {
    type: String,
  },
  maxMarks: {
    type: Number,
    required: true,
  },
  invigilator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  instructions: {
    type: String,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
}, { timestamps: true });

export const ExamSchedule = mongoose.model("ExamSchedule", examScheduleSchema);
