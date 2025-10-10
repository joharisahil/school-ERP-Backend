import mongoose from "mongoose";
import validator from "validator";

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who created the teacher
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: true,
    },
    phone2: {
      type: String,
      default: null, // optional phone number
    },
    dob: {
      type: Date,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    subjects: {
      type: [String], // array of subjects
      required: true,
    },
    qualifications: {
      type: [String], // multiple degrees
      required: true,
    },
    experienceYears: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);
teacherSchema.index({ admin: 1, email: 1 }, { unique: true });

export const Teacher = mongoose.model("Teacher", teacherSchema);
