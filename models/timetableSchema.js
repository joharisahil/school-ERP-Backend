import mongoose from "mongoose";

const periodSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    required: true,
  },
  periodNumber: { type: Number, required: true }, // e.g., 1st, 2nd, 3rd period
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
});

periodSchema.index({ day: 1, periodNumber: 1, teacherId: 1 }, { unique: true });
// ensures no teacher conflict in same period
periodSchema.index({ day: 1, periodNumber: 1, classId: 1 }, { unique: true });
// prevents same class having more than one period at same time


export const Period = mongoose.model("Period", periodSchema);
