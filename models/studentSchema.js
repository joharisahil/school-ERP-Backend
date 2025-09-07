import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who created the student
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      default: null,
      //required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    // grade: {
    //   type: String,
    //   required: true,
    // },
    dob: {
      type: Date,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
      default: null,
    },
    contactName: {
      type: String,
      required: true,
      default: null,
    },
    contactPhone: {
      type: String,
      required: true,
      default: null,
    },
    relation: {
      type: String,
      required: true, // e.g. Father, Mother, Guardian
    },
    // New fields
    fatherName: {
      type: String,
      required: true,
      default: null,
    },
    motherName: {
      type: String,
      required: true,
      default: null,
    },
    fatherEmail: {
      type: String,
      required: true,
      default: null,
    },
    motherEmail: {
      type: String,
      required: true,
      default: null,
    },
    fatherOccupation: {
      type: String,
      required: true,
      default: null,
    },
    motherOccupation: {
      type: String,
      required: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure email is unique per school (admin)
studentSchema.index({ admin: 1, email: 1 }, { unique: true });

export const Student = mongoose.model("Student", studentSchema);
