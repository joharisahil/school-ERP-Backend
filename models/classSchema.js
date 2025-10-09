import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  grade: {
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  students: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Student" }
  ]
});

// Ensure grade + section is unique per school
classSchema.index({ grade: 1, section: 1 }, { unique: true });
classSchema.index({ admin: 1, grade: 1, section: 1 }, { unique: true });
export const Class = mongoose.model("Class", classSchema);
