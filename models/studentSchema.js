import mongoose from "mongoose";
import validator from "validator";

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
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: true,
    },
    fatherphone: {
      type: String,
    },
    motherphone: {
      type: String,
    },
    contactEmail: {
      type: String,

      validate: {
        validator: function (value) {
          if (!value) return true; // ✅ allow null or empty string
          return validator.isEmail(value);
        },
        message: "Please provide a valid email",
      },
      default: "",
    },
    contactName: {
      type: String,

      default: null,
    },
    contactPhone: {
      type: String,

      default: null,
    },
    relation: {
      type: String,
      // e.g. Father, Mother, Guardian
    },
    // New fields
    fatherName: {
      type: String,

      default: null,
    },
    motherName: {
      type: String,

      default: null,
    },
    fatherEmail: {
      type: String,
      validate: {
        validator: function (value) {
          if (!value) return true; // ✅ allow null or empty string
          return validator.isEmail(value);
        },
        message: "Please provide a valid email",
      },
      default: "",
    },
    motherEmail: {
      type: String,
      validate: {
        validator: function (value) {
          if (!value) return true; // ✅ allow null or empty string
          return validator.isEmail(value);
        },
        message: "Please provide a valid email",
      },
      default: "",
    },
    fatherOccupation: {
      type: String,

      default: null,
    },
    motherOccupation: {
      type: String,

      default: null,
    },
  },
  { timestamps: true }
);

// Ensure email is unique per school (admin)
studentSchema.index({ admin: 1, email: 1 }, { unique: true });

export const Student = mongoose.model("Student", studentSchema);
