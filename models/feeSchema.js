import mongoose from "mongoose";

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",   // Linking Student schema
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classes",   // Linking Class schema
    required: true
  },
  academicYear: {
    type: String, // e.g., "2024-2025"
    required: true
  },
  feeType: {
    type: String,
    enum: ["Tuition", "Transport", "Hostel", "Exam", "Other"],
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: function () {
      return this.totalAmount - this.amountPaid;
    }
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentHistory: [
    {
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      mode: { 
        type: String, 
        enum: ["Cash", "Card", "UPI", "Bank Transfer"], 
        required: true 
      },
      transactionId: { type: String }
    }
  ],
  extraFees: [
  {
    title: { type: String, required: true },  // e.g. "Late Fine", "Sports Fee"
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }
],

  status: {
    type: String,
    enum: ["Paid", "Partial", "Pending"],
    default: "Pending"
  },
  remarks: {
    type: String
  }
}, { timestamps: true });

export const Fee = mongoose.model("Fee", feeSchema);