// models/studentFee.model.js
import mongoose from "mongoose";

const installmentSchema = new mongoose.Schema({
  month: { type: String, required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["Pending","Paid"], default: "Pending" },
  amountPaid: { type: Number, default: 0, min: 0 }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  mode: { type: String, enum: ["Cash","UPI","Card","Bank Transfer"], required: true },
  transactionId: { type: String },
  month: { type: String, required: true }, // which installment this targets
  paidAt: { type: Date, default: Date.now }
}, { _id: true });

const studentFeeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  session: { type: String, required: true },
  structureId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeStructure", required: true },

  // Financials
  amountPerInstallment: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 }, // flat discount at assignment time
  netPayable: { type: Number, required: true, min: 0 },

  // Running totals
  totalPaid: { type: Number, default: 0, min: 0 },
  balance: { type: Number, required: true, min: 0 },

  // Schedule
  installments: { type: [installmentSchema], required: true },

  // Payments
  payments: { type: [paymentSchema], default: [] },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

studentFeeSchema.index({ studentId: 1, session: 1 }, { unique: true }); // one assignment per session

export const StudentFee = mongoose.model("StudentFee", studentFeeSchema);
