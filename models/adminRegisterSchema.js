import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const adminRegisterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
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
    enum: ["admin", "student", "teacher"],
    required: true,
  }
});

// Hash password before saving
adminRegisterSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
adminRegisterSchema.methods.isValidPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export const Admin = mongoose.model('Admin Register', adminRegisterSchema);

