// models/feeStructure.model.js
import mongoose from "mongoose";

// const MONTHS = [
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December",
//   "January",
//   "February",
//   "March",
// ];


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

// const feeStructureSchema = new mongoose.Schema(
//   {
//     classId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Class",
//       required: true,
//     },
//     session: {
//       type: String,
//       required: true,
//     }, // e.g. "2025-26"
//     collectionMonths: {
//       type: [String],
//       validate: {
//         validator: (arr) =>
//           arr.length > 0 && arr.every((m) => MONTHS.includes(m)),
//         message: "collectionMonths must be valid month names and non-empty.",
//       },
//       required: true,
//     },
//     dueDates: {
//       type: Map, // key: month (e.g. "April"), value: Date string
//       of: Date,
//       required: true,
//     },
//     amountPerInstallment: {
//       type: Number,
//       min: 0,
//       required: true,
//     },
//     totalAmount: {
//       type: Number,
//       min: 0,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ["Draft", "Published"],
//       default: "Published",
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// // Ensure unique per class + session (only one active structure)
// feeStructureSchema.index({ classId: 1, session: 1 }, { unique: true });

// // Auto-calc totalAmount
// feeStructureSchema.pre("validate", function (next) {
//   if (
//     this.collectionMonths?.length &&
//     typeof this.amountPerInstallment === "number"
//   ) {
//     this.totalAmount = this.collectionMonths.length * this.amountPerInstallment;
//   }
//   next();
// });

// // Validate dueDates keys match collectionMonths
// feeStructureSchema.pre("validate", function (next) {
//   const months = new Set(this.collectionMonths || []);
//   const keys = new Set(this.dueDates ? Array.from(this.dueDates.keys()) : []);

//   if (months.size === 0 || months.size !== keys.size) {
//     return next(
//       new Error(
//         "dueDates must include exactly one date for each collection month."
//       )
//     );
//   }

//   for (const m of months) {
//     if (!keys.has(m)) {
//       return next(new Error(`Missing dueDate for month: ${m}`));
//     }
//   }

//   next();
// });

// export const FeeStructure = mongoose.model(
//   "FeeStructure",
//   feeStructureSchema
// );



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
    status: { type: String, enum: ["Draft", "Published"], default: "Published" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Ensure unique FeeStructure per class + session
feeStructureSchema.index({ classId: 1, session: 1 }, { unique: true });

// Auto-calculate totalAmount
feeStructureSchema.pre("validate", function (next) {
  if (this.monthDetails?.length) {
    this.totalAmount = this.monthDetails.reduce((sum, m) => sum + m.amount, 0);
  }
  next();
});

export const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);
