import { FeeStructure } from "../models/feeStructureSchema.js";
import { StudentFee } from "../models/studentFeeSchema.js";
import { Student } from "../models/studentSchema.js"; // assuming you already have this
import { Class } from "../models/classSchema.js";

// export const applyScholarship = async (req, res) => {
//   try {
//     // Only admin can access
//     if (req.user.role !== "admin") {
//       return res
//         .status(403)
//         .json({ error: "Only admins can apply scholarships" });
//     }

//     const { registrationNumber } = req.params;
//     const { name, type, value, valueType, period, months = [] } = req.body;

//     // 1. Find student by registrationNumber and populate classId
//     const student = await Student.findOne({ registrationNumber }).populate({
//       path: "classId",
//       select: "grade section",
//     });

//     if (!student) {
//       return res.status(404).json({ error: "Student not found" });
//     }

//     // 2. Find student fee record by studentId
//     const studentFee = await StudentFee.findOne({ studentId: student._id })
//       .populate({
//         path: "studentId",
//         select: "firstName lastName registrationNumber classId",
//         populate: { path: "classId", select: "grade section" },
//       })
//       .populate("structureId", "session totalAmount amountPerInstallment");

//     if (!studentFee) {
//       return res.status(404).json({ error: "Student fee not found" });
//     }

//     // 3. Create scholarship object
//     const scholarship = {
//       name,
//       type,
//       value: value || 0,
//       valueType: valueType || "fixed",
//       period,
//       months,
//       appliedAt: new Date(),
//     };

//     // 4. Push scholarship to studentFee
//     studentFee.scholarships.push(scholarship);

//     // 5. Apply scholarship logic to installments
//     studentFee.installments.forEach((inst) => {
//       studentFee.scholarships.forEach((sch) => {
//         let scholarshipAmount = 0;

//         if (sch.type === "full") scholarshipAmount = inst.amount;
//         else if (sch.type === "half") scholarshipAmount = inst.amount / 2;
//         else if (sch.type === "custom") {
//           scholarshipAmount =
//             sch.valueType === "percentage"
//               ? (inst.amount * sch.value) / 100
//               : sch.value;
//         }

//         if (sch.period === "yearly" || sch.months.includes(inst.month)) {
//           inst.amount -= scholarshipAmount;
//           if (inst.amount < 0) inst.amount = 0;
//         }
//       });
//     });

//     // 6. Update netPayable & balance
//     studentFee.netPayable = studentFee.installments.reduce(
//       (acc, i) => acc + i.amount,
//       0
//     );
//     studentFee.balance = studentFee.netPayable - studentFee.totalPaid;

//     // 7. Save
//     await studentFee.save();

//     res.status(200).json({
//       message: "Scholarship applied successfully",
//       studentName: `${student.firstName} ${student.lastName || ""}`,
//       registrationNumber: student.registrationNumber,
//       className: student.classId
//         ? `${student.classId.grade} ${student.classId.section}`
//         : "",
//       session: studentFee.structureId?.session || "",
//       studentFee,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

export const applyScholarship = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can apply scholarships" });
    }

    const { registrationNumber } = req.params;
    const { name, type, value, period, months = [] } = req.body;

    // ✅ 1. Find student fee
    const studentFee = await StudentFee.findOne({
      registrationNumber,
    }).populate("studentId classId structureId");

    if (!studentFee) {
      return res.status(404).json({ message: "Student fee record not found" });
    }

    // ✅ 2. Loop through months and validate + apply
    for (const month of months) {
      const installment = studentFee.installments.find(
        (i) => i.month === month
      );
      if (!installment) continue;

      const monthFee = installment.amount;
      const paidAmount = installment.amountPaid || 0;

      // skip fully paid
      if (paidAmount >= monthFee) {
        return res.status(400).json({
          message: `Cannot apply scholarship for ${month} — month already fully paid.`,
        });
      }

      // calculate existing scholarships for that month
      const existingMonthScholarships = studentFee.scholarships
        .filter((s) => s.months.includes(month))
        .reduce((acc, s) => acc + (s.valueType === "fixed" ? s.value : 0), 0);

      // calculate new scholarship amount based on type
      let newScholarshipAmount = 0;

      if (type === "full") {
        newScholarshipAmount =
          monthFee - (paidAmount + existingMonthScholarships);
      } else if (type === "half") {
        newScholarshipAmount = Math.floor(
          monthFee / 2 - existingMonthScholarships
        );
      } else if (type === "custom") {
        newScholarshipAmount = value;
      }

      // limit: scholarship cannot exceed unpaid portion
      const remaining = monthFee - (paidAmount + existingMonthScholarships);
      if (newScholarshipAmount > remaining) {
        return res.status(400).json({
          message: `Scholarship for ${month} exceeds unpaid portion. Remaining limit ₹${remaining}`,
        });
      }

      // prevent negatives
      if (newScholarshipAmount <= 0) {
        return res.status(400).json({
          message: `Scholarship for ${month} cannot be applied — no pending amount left.`,
        });
      }

      // ✅ Apply scholarship
      studentFee.scholarships.push({
        name,
        type,
        value: newScholarshipAmount,
        valueType: "fixed",
        period,
        months: [month],
        appliedAt: new Date(),
      });

      // Deduct from installment
      installment.amount -= newScholarshipAmount;
      if (installment.amount < 0) installment.amount = 0;
    }

    // ✅ 3. Recalculate totals
    studentFee.netPayable = studentFee.installments.reduce(
      (sum, i) => sum + i.amount,
      0
    );
    studentFee.balance = studentFee.netPayable - studentFee.totalPaid;
    if (studentFee.balance < 0) studentFee.balance = 0;

    await studentFee.save();

    res.status(200).json({
      message: "Scholarship applied successfully",
      studentName: `${studentFee.studentId.firstName} ${studentFee.studentId.lastName}`,
      registrationNumber: studentFee.registrationNumber,
      className: `${studentFee.classId.grade} ${studentFee.classId.section}`,
      session: studentFee.session,
      studentFee,
    });
  } catch (error) {
    console.error("Error applying scholarship:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getStudentsWithScholarships = async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can view this" });
    }

    // Find all student fees where scholarships array is not empty
    const studentsWithScholarships = await StudentFee.find({
      admin: req.user.id, 
      "scholarships.0": { $exists: true },
    })
      .populate("studentId", "firstName lastName rollNo classId")
      .populate("classId", "name")
      .populate("structureId", "session totalAmount amountPerInstallment");

    res.status(200).json({
      count: studentsWithScholarships.length,
      students: studentsWithScholarships,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeScholarship = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can remove scholarships" });
    }

    const { registrationNumber, scholarshipId } = req.params;

    // 1️⃣ Find student and fee record
    const student = await Student.findOne({ registrationNumber });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const studentFee = await StudentFee.findOne({
      studentId: student._id,
    }).populate("structureId");
    if (!studentFee)
      return res.status(404).json({ error: "Student fee not found" });

    // 2️⃣ Check if scholarship exists
    const scholarshipIndex = studentFee.scholarships.findIndex(
      (s) => s._id.toString() === scholarshipId
    );
    if (scholarshipIndex === -1)
      return res.status(404).json({ error: "Scholarship not found" });

    // 3️⃣ Get the scholarship being removed
    const removedScholarship = studentFee.scholarships[scholarshipIndex];

    // 4️⃣ Remove scholarship
    studentFee.scholarships.splice(scholarshipIndex, 1);

    // 5️⃣ Rebuild each installment properly
    for (const inst of studentFee.installments) {
      // Find the original base amount from structure (if available)
      const originalMonth = studentFee.structureId?.monthDetails?.find(
        (m) => m.month === inst.month
      );

      const baseAmount = originalMonth
        ? originalMonth.amount
        : inst.amount + (inst.scholarshipDeducted || 0);

      // Recalculate new installment from base
      let newAmount = baseAmount;

      // Apply remaining scholarships again
      studentFee.scholarships.forEach((sch) => {
        if (sch.period === "yearly" || sch.months.includes(inst.month)) {
          let scholarshipAmount = 0;

          if (sch.type === "full") scholarshipAmount = newAmount;
          else if (sch.type === "half") scholarshipAmount = newAmount / 2;
          else if (sch.type === "custom") scholarshipAmount = sch.value;

          newAmount -= scholarshipAmount;
          if (newAmount < 0) newAmount = 0;
        }
      });

      // Preserve paid amount & status
      if (inst.amountPaid >= newAmount) {
        inst.amount = newAmount;
        inst.status = "Paid";
      } else {
        inst.amount = newAmount;
        inst.status = inst.amountPaid > 0 ? "Partial" : "Pending";
      }
    }

    // 6️⃣ Update totals
    studentFee.netPayable = studentFee.installments.reduce(
      (sum, i) => sum + i.amount,
      0
    );
    studentFee.balance = studentFee.netPayable - studentFee.totalPaid;
    if (studentFee.balance < 0) studentFee.balance = 0;

    await studentFee.save();

    res.status(200).json({
      message: "Scholarship removed successfully",
      registrationNumber: student.registrationNumber,
      updatedScholarships: studentFee.scholarships,
      studentFee,
    });
  } catch (error) {
    console.error("Error removing scholarship:", error);
    res.status(500).json({ error: error.message });
  }
};
