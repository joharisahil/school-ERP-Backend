import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  user:{
   type:mongoose.SchemaTypes.ObjectId, 
   ref:"User", 
   required: true
  },
  name: {
    type: String,
    required: true
  },
  // subject: {
  //   type: String,
  //   required: true
  // },
  admin:{
    type: mongoose.SchemaTypes.ObjectId,
    ref:"User",
    required: true,
  },
  email:{
    type:String,
    required: true,
  }
});


teacherSchema.index({admin: 1, email: 1}, {unique:true});

export const Teacher = mongoose.model('Teacher', teacherSchema);

