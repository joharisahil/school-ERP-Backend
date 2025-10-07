import { FeeStructure } from "../models/feeStructureSchema.js";
import { StudentFee } from "../models/studentFeeSchema.js";
import { Student } from "../models/studentSchema.js"; // assuming you already have this
// export const collectFee = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ error: "Only admins can collect fees" });
//     }

//     let { amount, mode } = req.body; // total amount to pay
//     const { studentFeeId } = req.params;

//     const feeRecord = await StudentFee.findById(studentFeeId).populate("studentId");
//     if (!feeRecord) return res.status(404).json({ error: "Student fee record not found" });

//     // Generate unique transaction ID
//     let transactionId = generateTransactionId();
//     while (feeRecord.payments.some(p => p.transactionId === transactionId)) {
//       transactionId = generateTransactionId();
//     }

//     let amountLeft = amount;
//     const paymentsMade = [];

//     for (const installment of feeRecord.installments) {
//       if (installment.status === "Paid") continue; // skip fully paid

//       if (amountLeft >= installment.amount) {
//         installment.amountPaid = installment.amount;
//         installment.status = "Paid";
//         paymentsMade.push({ month: installment.month, amount: installment.amount });
//         amountLeft -= installment.amount;
//       } else {
//         // Cannot partially pay, stop here
//         break;
//       }
//     }

//     // Update totals
//     const totalPaidNow = paymentsMade.reduce((acc, p) => acc + p.amount, 0);
//     feeRecord.totalPaid += totalPaidNow;
//     feeRecord.balance = feeRecord.netPayable - feeRecord.totalPaid;

//     // Push into payments array (record total paid now as one transaction)
//     if (totalPaidNow > 0) {
//       feeRecord.payments.push({
//         amount: totalPaidNow,
//         mode,
//         transactionId,
//         month: paymentsMade.map(p => p.month).join(", "),
//       });
//     }

//     await feeRecord.save();

//     res.status(200).json({
//       message: "Payment recorded",
//       studentName: `${feeRecord.studentId.firstName} ${feeRecord.studentId.lastName}`,
//       transactionId,
//       paymentsMade,
//       leftoverAmount: amountLeft,
//       feeRecord,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
// adjust path

//
// export const getFeeStructures = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ error: "Only admins can view fee structures" });
//     }

//     const feeStructures = await FeeStructure.find().populate("classId", "name"); // populating class name
//     res.status(200).json(feeStructures);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };










//
// 1. Create Fee Structure (Admin only)

// export const createFeeStructure = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ error: "Only admins can create fee structures" });
//     }

//     const { classId, session, monthDetails } = req.body;

//     if (!monthDetails || !monthDetails.length) {
//       return res.status(400).json({ error: "monthDetails cannot be empty" });
//     }

//     // Create the FeeStructure
//     const feeStructure = await FeeStructure.create({
//       classId,
//       session,
//       monthDetails,
//       totalAmount: monthDetails.reduce((sum, m) => sum + m.amount, 0),
//       createdBy: req.user.id,
//     });

//     res.status(201).json({
//       message: "Fee structure created successfully",
//       feeStructure,
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(409).json({ error: "Fee structure already exists for this class & session" });
//     }
//     res.status(500).json({ error: error.message });
//   }
// };

// export const createFeeStructure = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ error: "Only admins can create fee structures" });
//     }

//     const { classIds, session, monthDetails } = req.body;

//     if (!classIds || !classIds.length) {
//       return res.status(400).json({ error: "At least one class must be selected" });
//     }

//     if (!monthDetails || !monthDetails.length) {
//       return res.status(400).json({ error: "monthDetails cannot be empty" });
//     }

//     const createdStructures = [];

//     for (const classId of classIds) {
//       // check existing
//       const exists = await FeeStructure.findOne({ classId, session });
//       if (exists) continue;

//       const feeStructure = new FeeStructure({
//         classId,          // ✅ matches schema
//         session,
//         monthDetails,
//         totalAmount: monthDetails.reduce((sum, m) => sum + m.amount, 0),
//         createdBy: req.user.id || req.user._id,
//       });

//       await feeStructure.save();
//       createdStructures.push(feeStructure);
//     }

//     if (!createdStructures.length) {
//       return res.status(409).json({ error: "Fee structures already exist for all selected classes" });
//     }

//     res.status(201).json({
//       success: true,
//       message: "Fee structures created successfully",
//       feeStructures: createdStructures,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// //
// // 2. Assign Fee to Student (Admin only)
// //
// // export const assignFeeToStudent = async (req, res) => {
// //   try {
// //     if (req.user.role !== "admin") {
// //       return res.status(403).json({ error: "Only admins can assign fees" });
// //     }

// //     const { studentId, classId, session, structureId = 0 } = req.body;

// //     // Get student + structure
// //     const student = await Student.findById(studentId);
// //     if (!student) return res.status(404).json({ error: "Student not found" });

// //     const structure = await FeeStructure.findById(structureId);
// //     if (!structure) return res.status(404).json({ error: "Fee structure not found" });

// //     if (structure.classId.toString() !== classId || structure.session !== session) {
// //       return res.status(400).json({ error: "Class/Session mismatch with Fee Structure" });
// //     }

// //     const totalAmount = structure.totalAmount;
// //     //const netPayable = totalAmount - discount;

// //     // Build installments
// //     const installments = structure.collectionMonths.map((month) => ({
// //       month,
// //       dueDate: structure.dueDates.get(month),
// //       amount: structure.amountPerInstallment,
// //       status: "Pending",
// //       amountPaid: 0,
// //     }));

// //     const studentFee = await StudentFee.create({
// //       studentId,
// //       classId,
// //       session,
// //       structureId,
// //       amountPerInstallment: structure.amountPerInstallment,
// //       totalAmount,
// //       //discount,
// //       netPayable,
// //       totalPaid: 0,
// //       balance: netPayable,
// //       installments,
// //       createdBy: req.user.id,
// //     });

// //     res.status(201).json({
// //       message: "Fee assigned to student",
// //       studentFee,
// //     });
// //   } catch (error) {
// //     if (error.code === 11000) {
// //       return res.status(409).json({ error: "Fee already assigned for this student & session" });
// //     }
// //     res.status(500).json({ error: error.message });
// //   }
// // };

// export const assignFeeToStudent = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ error: "Only admins can assign fees" });
//     }

//     const { studentId, classId, session, structureId } = req.body;

//     // Get student
//     const student = await Student.findById(studentId);
//     if (!student) return res.status(404).json({ error: "Student not found" });

//     // Get fee structure
//     const structure = await FeeStructure.findById(structureId);
//     if (!structure) return res.status(404).json({ error: "Fee structure not found" });

//     if (structure.classId.toString() !== classId || structure.session !== session) {
//       return res.status(400).json({ error: "Class/Session mismatch with Fee Structure" });
//     }

//     // Build installments from monthDetails
//     const installments = (structure.monthDetails || []).map((m) => ({
//       month: m.month,
//       startDate: m.startDate,
//       dueDate: m.dueDate,
//       amount: m.amount,
//       lateFine: m.lateFine || 0,
//       status: "Pending",
//       amountPaid: 0,
//     }));

//     const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);

//     const studentFee = await StudentFee.create({
//       studentId,
//       classId,
//       session,
//       structureId,
//       totalAmount,
//       netPayable: totalAmount,
//       totalPaid: 0,
//       balance: totalAmount,
//       installments,
//       createdBy: req.user.id,
//     });

//     res.status(201).json({
//       message: "Fee assigned to student",
//       studentFee,
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(409).json({ error: "Fee already assigned for this student & session" });
//     }
//     res.status(500).json({ error: error.message });
//   }
// };

export const createAndAssignFeeStructure = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create fee structures" });
    }

    const { classIds, session, monthDetails } = req.body;

    if (!classIds?.length) return res.status(400).json({ error: "At least one class required" });
    if (!monthDetails?.length) return res.status(400).json({ error: "monthDetails required" });

    const createdStructures = [];
    const allStudentFees = [];

    for (const classId of classIds) {
      // Skip if structure exists
      const exists = await FeeStructure.findOne({ classId, session });
      if (exists) continue;

      // Create fee structure
      const feeStructure = await FeeStructure.create({
        classId,
        session,
        monthDetails,
        totalAmount: monthDetails.reduce((sum, m) => sum + m.amount, 0),
        createdBy: req.user.id,
      });
      createdStructures.push(feeStructure);

      // Fetch students of this class & session
      const students = await Student.find({ classId, session });
      if (!students.length) continue;

      // Prepare student fees
      const studentFees = students.map((student) => {
        const installments = monthDetails.map((m) => ({
          month: m.month,
          startDate: m.startDate,
          dueDate: m.dueDate,
          amount: m.amount,
          lateFine: m.lateFine || 0,
          status: "Pending",
          amountPaid: 0,
        }));
        const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);

        return {
          studentId: student._id,
          classId,
          session,
          structureId: feeStructure._id,
          totalAmount,
          netPayable: totalAmount,
          totalPaid: 0,
          balance: totalAmount,
          installments,
          createdBy: req.user.id,
        };
      });

      // Insert all student fees in one go
      const createdStudentFees = await StudentFee.insertMany(studentFees);
      allStudentFees.push(...createdStudentFees);
    }

    if (!createdStructures.length) {
      return res.status(409).json({ error: "Fee structures already exist for all selected classes" });
    }

    res.status(201).json({
      message: "Fee structures created and assigned to students",
      feeStructures: createdStructures,
      studentFees: allStudentFees,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
// 3. Collect Fee (Admin only)
//
const generateTransactionId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  const timestamp = Date.now().toString().slice(-6);
  return `TXN-${random}-${timestamp}`;
};


export const collectFee = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can collect fees" });
    }

    const { amount, mode, month } = req.body;  // ❌ removed transactionId from client input
    const { studentFeeId } = req.params;

    const feeRecord = await StudentFee.findById(studentFeeId);
    if (!feeRecord) {
      return res.status(404).json({ error: "Student fee record not found" });
    }

    // Find installment
    const installment = feeRecord.installments.find((i) => i.month === month);
    if (!installment) {
      return res.status(400).json({ error: `Installment for ${month} not found` });
    }

    // Soft alert if not current calendar month
    const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
    let warning = null;
    if (currentMonth !== month) {
      warning = `Payment month differs from current month (current: ${currentMonth}, requested: ${month})`;
    }

    // Payment logic
    installment.amountPaid += amount;
    if (installment.amountPaid >= installment.amount) {
      installment.status = "Paid";
    } else if (installment.amountPaid > 0) {
      installment.status = "Partial";
    }

    feeRecord.totalPaid += amount;
    feeRecord.balance = feeRecord.netPayable - feeRecord.totalPaid;

    // Generate unique transactionId
    const transactionId = generateTransactionId();

    // Push into payments array
    feeRecord.payments.push({
      amount,
      mode,
      transactionId,
      month,
    });

    await feeRecord.save();

    res.status(200).json({
      message: "Payment recorded",
      warning,
      transactionId,   // return txn id to admin
      feeRecord,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
// 4. Get All Fee Structures (Admin only)

export const getFeeStructures = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can view fee structures" });
    }

    const query = {};
    if (req.query.session) {
      query.session = req.query.session;
    }

    const feeStructures = await FeeStructure.find(query).populate("classId", "name");

    if (!feeStructures.length) {
      return res.status(404).json({ error: "No fee structures found" });
    }

    res.status(200).json(feeStructures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//4.1 upadte fees 
// export const updateFeeStructure = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ error: "Only admins can update fee structures" });
//     }

//     const { structureId } = req.params;
//     const { monthDetails } = req.body;

//     if (!monthDetails || !monthDetails.length) {
//       return res.status(400).json({ error: "monthDetails cannot be empty" });
//     }

//     const structure = await FeeStructure.findById(structureId);
//     if (!structure) {
//       return res.status(404).json({ error: "Fee structure not found" });
//     }

//     // Update monthDetails and totalAmount
//     structure.monthDetails = monthDetails;
//     structure.totalAmount = monthDetails.reduce((sum, m) => sum + m.amount, 0);

//     await structure.save();

//     res.status(200).json({
//       message: "Fee structure updated successfully",
//       feeStructure: structure,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


export const updateFeeStructure = async (req, res) => {
  try {
    // 1️⃣ Check admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update fee structures" });
    }

    // 2️⃣ Extract params and body
    const { structureId } = req.params; // ✅ make sure route uses :structureId
    const { monthDetails } = req.body;

    if (!monthDetails || !monthDetails.length) {
      return res.status(400).json({ error: "monthDetails cannot be empty" });
    }

    // 3️⃣ Find the existing fee structure
    const structure = await FeeStructure.findById(structureId);
    if (!structure) {
      return res.status(404).json({ error: "Fee structure not found" });
    }

    // 4️⃣ Update month details and recalculate total
    structure.monthDetails = monthDetails;
    structure.totalAmount = monthDetails.reduce((sum, m) => sum + m.amount, 0);
    await structure.save();

    // 5️⃣ Update all related student fee records
    const relatedStudents = await StudentFee.find({ structureId: structure._id });

    for (const student of relatedStudents) {
      const oldTotal = student.totalAmount;
      const newTotal = structure.totalAmount;

      // Update student fee details
      student.totalAmount = newTotal;
      student.balance = newTotal - (student.totalPaid || 0);

      // Add a record in history
      student.history.push({
        updatedAt: new Date(),
        reason: "Fee structure revised by admin",
        oldTotal: oldTotal,
        newTotal: newTotal,
        adminId: req.user._id, // optional: track who updated
      });

      await student.save();
    }

    // 6️⃣ Send response
    res.status(200).json({
      message: "Fee structure and related student fees updated successfully",
      feeStructure: structure,
      updatedStudents: relatedStudents.length,
    });

  } catch (error) {
    console.error("Error updating fee structure:", error);
    res.status(500).json({ error: error.message });
  }
};

//4.2 delete fees 
export const deleteFeeStructure = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete fee structures" });
    }

    const { structureId } = req.params;

    const structure = await FeeStructure.findById(structureId);
    if (!structure) {
      return res.status(404).json({ error: "Fee structure not found" });
    }

    // Optional: remove all student fee records linked to this structure
    await StudentFee.deleteMany({ structureId });

    await structure.deleteOne();

    res.status(200).json({ message: "Fee structure deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
// 5. Get Fee Structure by ID (Admin only)
//
export const getFeeStructureById = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can view fee structures" });
    }

    const { classId } = req.params;
    //console.log("class id",classId);
    //const structure = await FeeStructure.findById(classId).populate("classId", "name");
    const structure = await FeeStructure.findOne({ classId }).populate("classId", "name");
    if (!structure) return res.status(404).json({ error: "Fee structure not found" });

    res.status(200).json(structure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
// 6. Get Fee Record for a Student (Admin + Student themselves)
//
export const getStudentFee = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Admins can see any student, Students can only see their own
    if (req.user.role !== "admin" && req.user.id !== studentId) {
      return res.status(403).json({ error: "Unauthorized to view this student's fee" });
    }

    const studentFee = await StudentFee.find({ studentId })
      .populate("studentId", "name rollNo classId")
      .populate("classId", "name")
      .populate("structureId", "session totalAmount amountPerInstallment");

    if (!studentFee.length) {
      return res.status(404).json({ error: "No fee record found for this student" });
    }

    res.status(200).json(studentFee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
// 7. Get All Students’ Fee Records (Admin only)
//
export const getAllStudentFees = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can view all student fees" });
    }

    const allFees = await StudentFee.find()
      .populate("studentId", "name rollNo classId")
      .populate("classId", "name")
      .populate("structureId", "session totalAmount amountPerInstallment");

    res.status(200).json(allFees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//new work 30-03-25
export const applyScholarship = async (req, res) => {
  try {
    const { studentFeeId } = req.params;
    const { name, type, value, valueType, period, months = [] } = req.body;

    // 1. Find student fee record
    const studentFee = await StudentFee.findById(studentFeeId);
    if (!studentFee) return res.status(404).json({ error: "Student fee not found" });

    // 2. Create scholarship object
    const scholarship = {
      name,
      type,
      value: value || 0,
      valueType: valueType || "fixed",
      period,
      months,
      appliedAt: new Date()
    };

    // 3. Push scholarship to studentFee
    studentFee.scholarships.push(scholarship);

    // 4. Apply scholarship logic to installments
    studentFee.installments.forEach(inst => {
      studentFee.scholarships.forEach(sch => {
        let scholarshipAmount = 0;

        if (sch.type === "full") {
          scholarshipAmount = inst.amount;
        } else if (sch.type === "half") {
          scholarshipAmount = inst.amount / 2;
        } else if (sch.type === "custom") {
          scholarshipAmount = sch.valueType === "percentage"
            ? (inst.amount * sch.value / 100)
            : sch.value;
        }

        // Apply only for selected months
        if (sch.period === "yearly" || (sch.months.includes(inst.month))) {
          inst.amount -= scholarshipAmount;
          if (inst.amount < 0) inst.amount = 0;
        }
      });
    });

    // 5. Update netPayable & balance
    studentFee.netPayable = studentFee.installments.reduce((acc, i) => acc + i.amount, 0);
    studentFee.balance = studentFee.netPayable - studentFee.totalPaid;

    // 6. Save
    await studentFee.save();

    res.status(200).json({
      message: "Scholarship applied successfully",
      studentFee
    });

  } catch (error) {
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
    const studentsWithScholarships = await StudentFee.find({ "scholarships.0": { $exists: true } })
      .populate("studentId", "firstName lastName rollNo classId")
      .populate("classId", "name")
      .populate("structureId", "session totalAmount amountPerInstallment");

    res.status(200).json({
      count: studentsWithScholarships.length,
      students: studentsWithScholarships
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};