import { FeeStructure } from "../models/feeStructureSchema.js";
import { StudentFee } from "../models/studentFeeSchema.js";
import { Student } from "../models/studentSchema.js"; // assuming you already have this

//
// 1. Create Fee Structure (Admin only)
//
export const createFeeStructure = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create fee structures" });
    }

    const { classId, session, collectionMonths, dueDates, amountPerInstallment } = req.body;

    // Server computes totalAmount
    const totalAmount = (collectionMonths?.length || 0) * amountPerInstallment;

    const feeStructure = await FeeStructure.create({
      classId,
      session,
      collectionMonths,
      dueDates,
      amountPerInstallment,
      totalAmount,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Fee structure created successfully",
      feeStructure,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Fee structure already exists for this class & session" });
    }
    res.status(500).json({ error: error.message });
  }
};

//
// 2. Assign Fee to Student (Admin only)
//
export const assignFeeToStudent = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can assign fees" });
    }

    const { studentId, classId, session, structureId, discount = 0 } = req.body;

    // Get student + structure
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const structure = await FeeStructure.findById(structureId);
    if (!structure) return res.status(404).json({ error: "Fee structure not found" });

    if (structure.classId.toString() !== classId || structure.session !== session) {
      return res.status(400).json({ error: "Class/Session mismatch with Fee Structure" });
    }

    const totalAmount = structure.totalAmount;
    const netPayable = totalAmount - discount;

    // Build installments
    const installments = structure.collectionMonths.map((month) => ({
      month,
      dueDate: structure.dueDates.get(month),
      amount: structure.amountPerInstallment,
      status: "Pending",
      amountPaid: 0,
    }));

    const studentFee = await StudentFee.create({
      studentId,
      classId,
      session,
      structureId,
      amountPerInstallment: structure.amountPerInstallment,
      totalAmount,
      discount,
      netPayable,
      totalPaid: 0,
      balance: netPayable,
      installments,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Fee assigned to student",
      studentFee,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Fee already assigned for this student & session" });
    }
    res.status(500).json({ error: error.message });
  }
};

//
// 3. Collect Fee (Admin only)
//
export const collectFee = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can collect fees" });
    }

    const { amount, mode, transactionId, month } = req.body;
    const { studentFeeId } = req.params;

    const feeRecord = await StudentFee.findById(studentFeeId);
    if (!feeRecord) return res.status(404).json({ error: "Student fee record not found" });

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
      feeRecord,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//
// 4. Get All Fee Structures (Admin only)
//
export const getFeeStructures = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can view fee structures" });
    }

    const feeStructures = await FeeStructure.find().populate("classId", "name"); // populating class name
    res.status(200).json(feeStructures);
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

    const { structureId } = req.params;
    const structure = await FeeStructure.findById(structureId).populate("classId", "name");
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
