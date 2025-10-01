import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    //required: true,
    unique: true, // e.g., MATH101, ENG102
  }, 
  admin: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User", // the school admin
    required: true,
  },
  teachers: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Teacher",
    },
  ],
  classes: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Class", // optional, if subject is class-specific
    },
  ],
});

// Ensure subject `code` is unique per admin (school)
subjectSchema.index({ admin: 1, code: 1 }, { unique: true });

export const Subject = mongoose.model("Subject", subjectSchema);
