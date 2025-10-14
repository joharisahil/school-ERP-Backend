import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  updatedAt: { type: Date, default: Date.now },
  reason: { type: String, required: true },
  oldTotal: { type: Number },
  newTotal: { type: Number },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // who made the change
}, { _id: false });

const installmentSchema = new mongoose.Schema({
  month: { type: String, required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["Pending","Partial","Paid"], default: "Pending" },
  amountPaid: { type: Number, default: 0, min: 0 }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  mode: { type: String, enum: ["Cash","UPI","Card","Bank Transfer"], required: true },
  transactionId: { type: String },
  month: { type: String, required: true },
  paidAt: { type: Date, default: Date.now }
}, { _id: true });

const scholarshipSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Sibling Scholarship"
  type: { type: String, enum: ["full","half","custom"], required: true },
  value: { type: Number, default: 0, min: 0 },
  valueType: { type: String, enum: ["fixed","percentage"], default: "fixed" },
  period: { type: String, enum: ["monthly","quarterly","yearly","one-time"], required: true },
  months: { type: [String], default: [] },
  appliedAt: { type: Date, default: Date.now }
}, { _id: true });

// const studentFeeSchema = new mongoose.Schema({
//   studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
//   classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
//   session: { type: String, required: true },
//   structureId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeStructure", required: true },

//   // Financials
//   amountPerInstallment: { type: Number, required: false, min: 0 },
//   totalAmount: { type: Number, required: true, min: 0 },
//   netPayable: { type: Number, required: true, min: 0 },

//   // Running totals
//   totalPaid: { type: Number, default: 0, min: 0 },
//   balance: { type: Number, required: true, min: 0 },

//   // Schedule
//   installments: { type: [installmentSchema], required: true, default: [] },

//   // Payments
//   payments: { type: [paymentSchema], default: [] },

//   // Scholarships
//   scholarships: { type: [scholarshipSchema], default: [] },

//   // History
//   history: { type: [historySchema], default: [] },

//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

// }, { timestamps: true });

const studentFeeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },

  // Add this field for reference
  registrationNumber: {
    type: String,
    required: true,
  },

  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  session: { type: String, required: true },
  structureId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeStructure", required: true },

  // Financials
  amountPerInstallment: { type: Number, required: false, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  netPayable: { type: Number, required: true, min: 0 },

  // Running totals
  totalPaid: { type: Number, default: 0, min: 0 },
  balance: { type: Number, required: true, min: 0 },

  // Schedule
  installments: { type: [installmentSchema], required: true, default: [] },

  // Payments
  payments: { type: [paymentSchema], default: [] },

  // Scholarships
  scholarships: { type: [scholarshipSchema], default: [] },

  // History
  history: { type: [historySchema], default: [] },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }

}, { timestamps: true });


// Unique constraint: one fee assignment per student per session
studentFeeSchema.index({ studentId: 1, session: 1 }, { unique: true });

export const StudentFee = mongoose.model("StudentFee", studentFeeSchema);
