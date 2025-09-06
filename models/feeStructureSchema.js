// models/feeStructure.model.js
import mongoose from "mongoose";

const MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];

const feeStructureSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    session: { 
     type: String, 
     required: true
     }, // e.g. "2025-26"
    collectionMonths: {
      type: [String],
      validate: {
        validator: (arr) =>
          arr.length > 0 && arr.every((m) => MONTHS.includes(m)),
        message: "collectionMonths must be valid month names and non-empty.",
      },
      required: true,
    },
    // One due date per selected month
    dueDates: {
      type: Map, // key: month (e.g. "April"), value: Date string
      of: Date,
      required: true,
    },
    amountPerInstallment: {
      type: Number,
      min: 0,
      required: true,
    },
    totalAmount: {
      type: Number,
      min: 0,
      required: true,
    },
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

// Ensure unique per class + session (only one active structure)
feeStructureSchema.index({ classId: 1, session: 1 }, { unique: true });

// Server-side total calculation safeguard
feeStructureSchema.pre("validate", function (next) {
  if (
    this.collectionMonths?.length &&
    typeof this.amountPerInstallment === "number"
  ) {
    this.totalAmount = this.collectionMonths.length * this.amountPerInstallment;
  }
  next();
});

// Validate dueDates keys match collectionMonths
feeStructureSchema.pre("validate", function (next) {
  const months = new Set(this.collectionMonths || []);
  const keys = new Set(Object.keys(this.dueDates || {}));
  if (months.size === 0 || months.size !== keys.size) {
    return next(
      new Error(
        "dueDates must include exactly one date for each collection month."
      )
    );
  }
  for (const m of months)
    if (!keys.has(m)) return next(new Error(`Missing dueDate for month: ${m}`));
  next();
});

export const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);
