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
        .json({ error: "Only admins can apply scholarships" });
    }

    const { registrationNumber } = req.params;
    const { name, type, value, valueType, period, months = [] } = req.body;

    const student = await Student.findOne({ registrationNumber }).populate({
      path: "classId",
      select: "grade section",
    });

    if (!student)
      return res.status(404).json({ error: "Student not found" });

    const studentFee = await StudentFee.findOne({ studentId: student._id })
      .populate({
        path: "studentId",
        select: "firstName lastName registrationNumber classId",
        populate: { path: "classId", select: "grade section" },
      })
      .populate("structureId", "session totalAmount amountPerInstallment");

    if (!studentFee)
      return res.status(404).json({ error: "Student fee not found" });

    // ✅ Step 1: Create scholarship object
    const scholarship = {
      name,
      type,
      value: value || 0,
      valueType: valueType || "fixed",
      period,
      months,
      appliedAt: new Date(),
    };

    // ✅ Step 2: Apply logic installment-wise
    let blockedMonths = [];

    studentFee.installments.forEach((inst) => {
      // Skip months not covered
      const isTargeted =
        period === "yearly" || months.includes(inst.month);
      if (!isTargeted) return;

      // Skip fully paid months
      if (inst.amountPaid >= inst.originalAmount) {
        blockedMonths.push(inst.month);
        return;
      }

      // Remaining balance
      const remaining = inst.originalAmount - inst.amountPaid;
      let scholarshipAmount = 0;

      if (type === "full") scholarshipAmount = remaining;
      else if (type === "half") scholarshipAmount = remaining / 2;
      else if (type === "custom") {
        scholarshipAmount =
          valueType === "fixed"
            ? value
            : (remaining * value) / 100;
      }

      // Don’t reduce below 0 or below already-paid
      if (scholarshipAmount > remaining) scholarshipAmount = remaining;

      inst.amount = Math.max(inst.amount - scholarshipAmount, inst.amountPaid);
    });

    // ✅ Step 3: If all months are fully paid, reject scholarship
    if (blockedMonths.length === studentFee.installments.length) {
      return res.status(400).json({
        error: "Cannot apply scholarship. All months are already fully paid.",
      });
    }

    // ✅ Step 4: Save scholarship in array
    studentFee.scholarships.push(scholarship);

    // ✅ Step 5: Recalculate totals
    studentFee.netPayable = studentFee.installments.reduce(
      (acc, i) => acc + i.amount,
      0
    );
    studentFee.balance = studentFee.netPayable - studentFee.totalPaid;

    await studentFee.save();

    res.status(200).json({
      message:
        blockedMonths.length > 0
          ? `Scholarship applied but skipped fully-paid months: ${blockedMonths.join(
              ", "
            )}`
          : "Scholarship applied successfully",
      studentName: `${student.firstName} ${student.lastName || ""}`,
      registrationNumber: student.registrationNumber,
      className: student.classId
        ? `${student.classId.grade} ${student.classId.section}`
        : "",
      session: studentFee.structureId?.session || "",
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
    // ✅ Only admin can access
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can remove scholarships" });
    }

    const { registrationNumber, scholarshipId } = req.params;

    // ✅ 1. Find student
    const student = await Student.findOne({ registrationNumber });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // ✅ 2. Find fee record
    const studentFee = await StudentFee.findOne({ studentId: student._id });
    if (!studentFee) {
      return res.status(404).json({ error: "Student fee not found" });
    }

    // ✅ 3. Check if scholarship exists
    const scholarshipIndex = studentFee.scholarships.findIndex(
      (s) => s._id.toString() === scholarshipId
    );

    if (scholarshipIndex === -1) {
      return res.status(404).json({ error: "Scholarship not found" });
    }

    // ✅ 4. Remove scholarship
    studentFee.scholarships.splice(scholarshipIndex, 1);

    // ✅ 5. Reset installments to original structure (restore base fee amounts)
    // We assume StudentFee.structureId points to the FeeStructure that defines original amounts
    if (studentFee.structureId) {
      const structure = await studentFee.populate("structureId");
      if (structure.structureId?.monthDetails) {
        studentFee.installments = structure.structureId.monthDetails.map(
          (m) => ({
            month: m.month,
            dueDate: m.dueDate,
            amount: m.amount,
            status: "Pending",
            amountPaid: 0,
          })
        );
      }
    }

    // ✅ 6. Reapply remaining scholarships (if any)
    studentFee.installments.forEach((inst) => {
      studentFee.scholarships.forEach((sch) => {
        let scholarshipAmount = 0;

        if (sch.type === "full") scholarshipAmount = inst.amount;
        else if (sch.type === "half") scholarshipAmount = inst.amount / 2;
        else if (sch.type === "custom") {
          scholarshipAmount =
            sch.valueType === "percentage"
              ? (inst.amount * sch.value) / 100
              : sch.value;
        }

        if (sch.period === "yearly" || sch.months.includes(inst.month)) {
          inst.amount -= scholarshipAmount;
          if (inst.amount < 0) inst.amount = 0;
        }
      });
    });

    // ✅ 7. Recalculate totals
    studentFee.netPayable = studentFee.installments.reduce(
      (sum, i) => sum + i.amount,
      0
    );
    studentFee.balance = studentFee.netPayable - studentFee.totalPaid;

    // ✅ 8. Save
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
