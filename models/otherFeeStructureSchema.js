import mongoose from "mongoose";

const otherFeeStructureSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    session: String,

    title: {
      type: String,
      default: "Other Fees",
    },

    monthDetails: [
      {
        name: String, // Transport / Exam / Hostel
        month: String, // April, May
        amount: Number,
        startDate: Date,
        dueDate: Date,
      },
    ],

    totalAmount: Number,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
otherFeeStructureSchema.index(
  { admin: 1, classId: 1, session: 1, title: 1 },
  { unique: true }
);

otherFeeStructureSchema.pre("validate", function (next) {
  if (this.monthDetails?.length) {
    this.totalAmount = this.monthDetails.reduce(
      (sum, m) => sum + m.amount,
      0
    );
  }
  next();
});
export const OtherFeeStructure = mongoose.model(
  "OtherFeeStructure",
  otherFeeStructureSchema
);