import mongoose from "mongoose";

const studentOtherFeeSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },

    session: String,

    structureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OtherFeeStructure",
    },

    totalAmount: Number,
    netPayable: Number,
    totalPaid: { type: Number, default: 0 },
    balance: Number,

    installments: [
      {
        name: String,
        month: String,
        startDate: Date,
        dueDate: Date,
        amount: Number,
        amountPaid: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ["Pending", "Partial", "Paid"],
          default: "Pending",
        },
      },
    ],

    payments: [
      {
        amount: Number,
        mode: String,
        month: String,
        name: String,
        transactionId: String,
        collectedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        collectedAt: Date,
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
studentOtherFeeSchema.index(
  { admin: 1, studentId: 1, session: 1 },
  { unique: true }
);

export const StudentOtherFee = mongoose.model(
  "StudentOtherFee",
  studentOtherFeeSchema
);