import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  academicYear: {
    type: String, // e.g. "2024-25"
    required: true,
  },
  examType: {
    type: String,
    enum: ["midterm", "final", "quarterly", "unit test"],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // admin user
    required: true,
  },
}, { timestamps: true });

export const Exam = mongoose.model("Exam", examSchema);
