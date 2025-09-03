import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  // grade: {
  //   type: String,
  //   required: true,
  // },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
  },
  admin: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
  }
});

// Ensure email is unique per school (admin)
studentSchema.index({ admin: 1, email: 1 }, { unique: true });

export const Student = mongoose.model("Student", studentSchema);
