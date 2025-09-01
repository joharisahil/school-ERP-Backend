import mongoose from "mongoose";
import validator from "validator";

const studentSchema = new mongoose.Schema({
  user:{
    type: mongoose.SchemaTypes.ObjectId,
    ref:" User",
    required: true,
  },
  name: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  grade: {
    type: String,
    required: true
  },
  admin:{
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
  },
  email:{
    type: String,
    required: true,
  }
});


studentSchema.index({admin: 1, email: 1}, {unique: true});

export const Student = mongoose.model('Student', studentSchema);



