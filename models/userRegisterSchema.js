// models/userRegisterSchema.js
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["superadmin","admin", "student", "teacher"],
      required: true,
    },
    schoolName: {
      type: String,
      required: function () {
        return this.role === "admin";
      },
      trim: true,
    },
    planDays: {
      type: Number,
      required: function () {
        return this.role === "admin";
      },
      min: [0, "Plan days cannot be negative"],
      max: [360, "Plan days cannot exceed 360"],
      default: 360, // total plan limit
    },
    isActive: {
      type: Boolean,
      default: true, // admin is active by default
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.isValidPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
