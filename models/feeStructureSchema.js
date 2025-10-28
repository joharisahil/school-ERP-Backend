// models/feeStructure.model.js
import mongoose from "mongoose";

const monthDetailSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    lateFine: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const feeStructureSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    session: { type: String, required: true },
    monthDetails: {
      type: [monthDetailSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "monthDetails must contain at least one month",
      },
      required: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Published",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure unique FeeStructure per class + session
feeStructureSchema.index(
  { admin: 1, classId: 1, session: 1 },
  { unique: true }
);

// Auto-calculate totalAmount
feeStructureSchema.pre("validate", function (next) {
  if (this.monthDetails?.length) {
    this.totalAmount = this.monthDetails.reduce((sum, m) => sum + m.amount, 0);
  }
  next();
});

export const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);
