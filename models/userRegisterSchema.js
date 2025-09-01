// models/userRegisterSchema.js
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // ← remove this if you want school-level uniqueness
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
  },
}, { timestamps: true });

userSchema.pre("save", async function(next){
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isValidPassword = function(password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema); 
