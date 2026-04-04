import { OtherFeeStructure } from "../models/otherFeeStructureSchema.js";
import { StudentOtherFee } from "../models/studentOtherFeeSchema.js";
import { Student } from "../models/studentSchema.js";
import { Class } from "../models/classSchema.js";

const generateTransactionId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  const timestamp = Date.now().toString().slice(-6);
  return `TXN-${random}-${timestamp}`;
};

// ============================================
// CONTROLLER 1: JUST CREATE FEE STRUCTURE (NO STUDENT ASSIGNMENT)
// ============================================
export const createOtherFeeStructure = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;
    const { classIds, session, monthDetails, title } = req.body;

    // -------------------------------
    // VALIDATION
    // -------------------------------
    if (!classIds?.length) {
      return res.status(400).json({ error: "At least one class required" });
    }

    if (!session) {
      return res.status(400).json({ error: "Session is required" });
    }

    if (!monthDetails?.length) {
      return res.status(400).json({ error: "monthDetails required" });
    }

    // ensure required fields
    for (const m of monthDetails) {
      if (!m.name || !m.month || !m.amount || !m.dueDate) {
        return res.status(400).json({
          error: "Each entry must have name, month, amount, dueDate",
        });
      }
    }

    const createdStructures = [];

    for (const classId of classIds) {
      const classExists = await Class.findOne({
        _id: classId,
        admin: adminId,
      });

      if (!classExists) continue;

      const exists = await OtherFeeStructure.findOne({
        admin: adminId,
        classId,
        session,
      });

      if (exists) continue;

      const totalAmount = monthDetails.reduce(
        (sum, m) => sum + (m.amount || 0),
        0
      );

      const structure = await OtherFeeStructure.create({
        admin: adminId,
        classId,
        session,
        title: title || `Other Fees - ${session}`,
        monthDetails,
        totalAmount,
        createdBy: req.user.id,
      });

      createdStructures.push(structure);
    }

    if (!createdStructures.length) {
      return res.status(409).json({
        error: "Fee structure already exists for these classes or invalid classes",
      });
    }

    res.status(201).json({
      success: true,
      message: "Fee structure(s) created successfully",
      session,
      feeStructures: createdStructures,
    });
  } catch (error) {
    console.error("Create Other Fee Structure Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// // ============================================
// // CONTROLLER 2: APPLY FEE STRUCTURE TO SPECIFIC STUDENTS
// // ============================================
// export const applyFeeStructureToStudents = async (req, res) => {
//   try {
//     const adminId = req.schoolAdminId;
//     const { structureId } = req.params;
//     const { studentIds } = req.body;

//     // Validate structureId
//     if (!structureId) {
//       return res.status(400).json({ error: "Structure ID is required" });
//     }

//     // Validate studentIds
//     if (!studentIds || !studentIds.length) {
//       return res.status(400).json({ error: "At least one student ID is required" });
//     }

//     // Find the fee structure
//     const structure = await OtherFeeStructure.findOne({
//       _id: structureId,
//       admin: adminId,
//     });

//     if (!structure) {
//       return res.status(404).json({ error: "Fee structure not found" });
//     }

//     // Check if any of these students already have this fee applied
//     const existingApplications = await StudentOtherFee.find({
//       structureId: structure._id,
//       studentId: { $in: studentIds },
//       admin: adminId,
//     });

//     if (existingApplications.length > 0) {
//       const existingStudentIds = existingApplications.map(app => app.studentId.toString());
//       return res.status(409).json({
//         error: "Some students already have this fee structure applied",
//         existingStudentIds,
//         message: `Fee already applied to ${existingApplications.length} student(s)`,
//       });
//     }

//     // Find the students
//     const students = await Student.find({
//       _id: { $in: studentIds },
//       classId: structure.classId,
//       admin: adminId,
//     });

//     if (!students.length) {
//       return res.status(404).json({
//         error: "No valid students found",
//       });
//     }

//     // Create fee records for selected students
//     const studentFees = students.map((student) => ({
//       admin: adminId,
//       studentId: student._id,
//       classId: structure.classId,
//       session: structure.session,
//       structureId: structure._id,
//       totalAmount: structure.totalAmount,
//       netPayable: structure.totalAmount,
//       totalPaid: 0,
//       balance: structure.totalAmount,
//       installments: structure.monthDetails.map((m) => ({
//         name: m.name,
//         month: m.month,
//         startDate: m.startDate,
//         dueDate: m.dueDate,
//         amount: m.amount,
//         status: "Pending",
//         amountPaid: 0,
//       })),
//       createdBy: req.user.id,
//     }));

//     const created = await StudentOtherFee.insertMany(studentFees);

//     res.status(201).json({
//       success: true,
//       message: `Fee structure applied to ${students.length} student(s)`,
//       structureId: structure._id,
//       studentsAffected: students.length,
//       studentFees: created,
//     });
//   } catch (error) {
//     console.error("Apply Fee Structure Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// ============================================
// CONTROLLER 3: APPLY FEE STRUCTURE TO SINGLE STUDENT
// ============================================
// ============================================
// CONTROLLER 2: APPLY FEE STRUCTURE TO SPECIFIC STUDENTS (WITH INSTALLMENT SELECTION)
// ============================================
export const applyFeeStructureToStudents = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;
    const { structureId } = req.params;
    const { studentIds, installmentIndices } = req.body;

    // Validate structureId
    if (!structureId) {
      return res.status(400).json({ error: "Structure ID is required" });
    }

    // Validate studentIds
    if (!studentIds || !studentIds.length) {
      return res.status(400).json({ error: "At least one student ID is required" });
    }

    // Find the fee structure
    const structure = await OtherFeeStructure.findOne({
      _id: structureId,
      admin: adminId,
    });

    if (!structure) {
      return res.status(404).json({ error: "Fee structure not found" });
    }

    // Select installments (all if not specified)
    let selectedInstallments = structure.monthDetails;
    if (installmentIndices && installmentIndices.length) {
      selectedInstallments = installmentIndices.map(idx => {
        if (idx < 0 || idx >= structure.monthDetails.length) {
          throw new Error(`Invalid installment index: ${idx}`);
        }
        return structure.monthDetails[idx];
      });
      
      // Validate no duplicates
      if (new Set(installmentIndices).size !== installmentIndices.length) {
        return res.status(400).json({ error: "Duplicate installment indices not allowed" });
      }
    }

    // Calculate total amount for selected installments
    const totalSelectedAmount = selectedInstallments.reduce(
      (sum, inst) => sum + inst.amount, 
      0
    );

    // Check if any of these students already have this fee applied
    const existingApplications = await StudentOtherFee.find({
      structureId: structure._id,
      studentId: { $in: studentIds },
      admin: adminId,
    });

    if (existingApplications.length > 0) {
      const existingStudentIds = existingApplications.map(app => app.studentId.toString());
      return res.status(409).json({
        error: "Some students already have this fee structure applied",
        existingStudentIds,
        message: `Fee already applied to ${existingApplications.length} student(s)`,
      });
    }

    // Find the students
    const students = await Student.find({
      _id: { $in: studentIds },
      classId: structure.classId,
      admin: adminId,
    });

    if (!students.length) {
      return res.status(404).json({
        error: "No valid students found",
      });
    }

    // Create fee records for selected students with chosen installments
    const studentFees = students.map((student) => ({
      admin: adminId,
      studentId: student._id,
      classId: structure.classId,
      session: structure.session,
      structureId: structure._id,
      totalAmount: totalSelectedAmount,
      netPayable: totalSelectedAmount,
      totalPaid: 0,
      balance: totalSelectedAmount,
      installments: selectedInstallments.map((inst) => ({
        name: inst.name,
        month: inst.month,
        startDate: inst.startDate,
        dueDate: inst.dueDate,
        amount: inst.amount,
        status: "Pending",
        amountPaid: 0,
      })),
      createdBy: req.user.id,
    }));

    const created = await StudentOtherFee.insertMany(studentFees);

    res.status(201).json({
      success: true,
      message: `Fee structure applied to ${students.length} student(s) with ${selectedInstallments.length} installment(s)`,
      structureId: structure._id,
      studentsAffected: students.length,
      installmentsApplied: selectedInstallments.length,
      totalAmount: totalSelectedAmount,
      studentFees: created,
    });
  } catch (error) {
    console.error("Apply Fee Structure Error:", error);
    res.status(500).json({ error: error.message });
  }
};


// export const applyFeeStructureToSingleStudent = async (req, res) => {
//   try {
//     const adminId = req.schoolAdminId;
//     const { structureId, studentId } = req.params;

//     // Find the fee structure
//     const structure = await OtherFeeStructure.findOne({
//       _id: structureId,
//       admin: adminId,
//     });

//     if (!structure) {
//       return res.status(404).json({ error: "Fee structure not found" });
//     }

//     // Find the student
//     const student = await Student.findOne({
//       _id: studentId,
//       classId: structure.classId,
//       admin: adminId,
//     });

//     if (!student) {
//       return res.status(404).json({
//         error: "Student not found or not in the correct class",
//       });
//     }

//     // Check if already applied
//     const existing = await StudentOtherFee.findOne({
//       structureId: structure._id,
//       studentId: student._id,
//       admin: adminId,
//     });

//     if (existing) {
//       return res.status(409).json({
//         error: "Fee structure already applied to this student",
//       });
//     }

//     // Create fee record for the student
//     const studentFee = await StudentOtherFee.create({
//       admin: adminId,
//       studentId: student._id,
//       classId: structure.classId,
//       session: structure.session,
//       structureId: structure._id,
//       totalAmount: structure.totalAmount,
//       netPayable: structure.totalAmount,
//       totalPaid: 0,
//       balance: structure.totalAmount,
//       installments: structure.monthDetails.map((m) => ({
//         name: m.name,
//         month: m.month,
//         startDate: m.startDate,
//         dueDate: m.dueDate,
//         amount: m.amount,
//         status: "Pending",
//         amountPaid: 0,
//       })),
//       createdBy: req.user.id,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Fee structure applied to student successfully",
//       studentFee,
//     });
//   } catch (error) {
//     console.error("Apply Fee Structure to Single Student Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// ============================================
// COLLECT OTHER FEE (UNCHANGED)
// ============================================
// ============================================
// CONTROLLER 3: APPLY FEE STRUCTURE TO SINGLE STUDENT (WITH INSTALLMENT SELECTION)
// ============================================
export const applyFeeStructureToSingleStudent = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;
    const { structureId, studentId } = req.params;
    const { installmentIndices } = req.body;

    // Find the fee structure
    const structure = await OtherFeeStructure.findOne({
      _id: structureId,
      admin: adminId,
    });

    if (!structure) {
      return res.status(404).json({ error: "Fee structure not found" });
    }

    // Select installments (all if not specified)
    let selectedInstallments = structure.monthDetails;
    if (installmentIndices && installmentIndices.length) {
      selectedInstallments = installmentIndices.map(idx => {
        if (idx < 0 || idx >= structure.monthDetails.length) {
          throw new Error(`Invalid installment index: ${idx}`);
        }
        return structure.monthDetails[idx];
      });
      
      // Validate no duplicates
      if (new Set(installmentIndices).size !== installmentIndices.length) {
        return res.status(400).json({ error: "Duplicate installment indices not allowed" });
      }
    }

    // Calculate total amount for selected installments
    const totalSelectedAmount = selectedInstallments.reduce(
      (sum, inst) => sum + inst.amount, 
      0
    );

    // Find the student
    const student = await Student.findOne({
      _id: studentId,
      classId: structure.classId,
      admin: adminId,
    });

    if (!student) {
      return res.status(404).json({
        error: "Student not found or not in the correct class",
      });
    }

    // Check if already applied
    const existing = await StudentOtherFee.findOne({
      structureId: structure._id,
      studentId: student._id,
      admin: adminId,
    });

    if (existing) {
      return res.status(409).json({
        error: "Fee structure already applied to this student",
      });
    }

    // Create fee record for the student with selected installments
    const studentFee = await StudentOtherFee.create({
      admin: adminId,
      studentId: student._id,
      classId: structure.classId,
      session: structure.session,
      structureId: structure._id,
      totalAmount: totalSelectedAmount,
      netPayable: totalSelectedAmount,
      totalPaid: 0,
      balance: totalSelectedAmount,
      installments: selectedInstallments.map((inst) => ({
        name: inst.name,
        month: inst.month,
        startDate: inst.startDate,
        dueDate: inst.dueDate,
        amount: inst.amount,
        status: "Pending",
        amountPaid: 0,
      })),
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: `Fee structure applied to student successfully with ${selectedInstallments.length} installment(s)`,
      totalAmount: totalSelectedAmount,
      installmentsApplied: selectedInstallments.length,
      studentFee,
    });
  } catch (error) {
    console.error("Apply Fee Structure to Single Student Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const collectOtherFee = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;
    const { studentFeeId } = req.params;
    const { amount, mode, month, name } = req.body;

    if (!amount || !mode || !month || !name) {
      return res.status(400).json({
        error: "amount, mode, month, name required",
      });
    }

    const feeRecord = await StudentOtherFee.findOne({
      _id: studentFeeId,
      admin: adminId,
    });

    if (!feeRecord) {
      return res.status(404).json({ error: "Fee record not found" });
    }

    const installment = feeRecord.installments.find(
      (i) => i.month === month && i.name === name,
    );

    if (!installment) {
      return res.status(400).json({
        error: "Installment not found",
      });
    }

    installment.amountPaid += amount;

    installment.status =
      installment.amountPaid >= installment.amount
        ? "Paid"
        : installment.amountPaid > 0
          ? "Partial"
          : "Pending";

    feeRecord.totalPaid += amount;
    feeRecord.balance = Math.max(feeRecord.netPayable - feeRecord.totalPaid, 0);

    const transactionId = generateTransactionId();

    feeRecord.payments.push({
      amount,
      mode,
      month,
      name,
      transactionId,
      collectedBy: req.user.id,
      collectedAt: new Date(),
    });

    await feeRecord.save();

    res.status(200).json({
      success: true,
      transactionId,
      feeRecord,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// UPDATE OTHER FEE STRUCTURE (UNCHANGED)
// ============================================
export const updateOtherFeeStructure = async (req, res) => {
  try {
    const { structureId } = req.params;
    const { monthDetails } = req.body;

    const structure = await OtherFeeStructure.findOne({
      _id: structureId,
      admin: req.schoolAdminId,
    });

    if (!structure) {
      return res.status(404).json({ error: "Not found" });
    }

    const newTotal = monthDetails.reduce((sum, m) => sum + m.amount, 0);

    structure.monthDetails = monthDetails;
    structure.totalAmount = newTotal;

    await structure.save();

    const students = await StudentOtherFee.find({
      structureId,
      admin: req.schoolAdminId,
    });

    for (const s of students) {
      s.totalAmount = newTotal;
      s.netPayable = newTotal;
      s.balance = newTotal - s.totalPaid;

      s.installments = monthDetails.map((m) => ({
        name: m.name,
        month: m.month,
        startDate: m.startDate,
        dueDate: m.dueDate,
        amount: m.amount,
        amountPaid: 0,
        status: "Pending",
      }));

      await s.save();
    }

    res.status(200).json({
      success: true,
      affectedStudents: students.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// DELETE OTHER FEE STRUCTURE (UNCHANGED)
// ============================================
export const deleteOtherFeeStructure = async (req, res) => {
  try {
    const { structureId } = req.params;

    const hasPayments = await StudentOtherFee.exists({
      structureId,
      totalPaid: { $gt: 0 },
    });

    if (hasPayments) {
      return res.status(409).json({
        error: "Cannot delete, payments exist",
      });
    }

    await StudentOtherFee.deleteMany({ structureId });
    await OtherFeeStructure.findByIdAndDelete(structureId);

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// GET STUDENT OTHER FEE BY REG NO (UNCHANGED)
// ============================================
export const getStudentOtherFeeByRegNo = async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    const adminId = req.schoolAdminId;
    const role = req.user.role;

    const student = await Student.findOne({
      registrationNumber,
      admin: adminId,
    }).populate("classId", "grade section");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (role === "student" && req.user.id !== student.user?.toString()) {
      return res.status(403).json({
        error: "You can only view your own fee details",
      });
    }

    const otherFees = await StudentOtherFee.find({
      studentId: student._id,
      admin: adminId,
    }).populate("structureId", "title session");

    if (!otherFees.length) {
      return res.status(404).json({
        error: "No other fee records found",
      });
    }

    const result = otherFees.map((fee) => ({
      _id: fee._id,
      title: fee.structureId?.title || "Other Fees",
      session: fee.session,
      studentName: `${student.firstName} ${student.lastName || ""}`.trim(),
      registrationNumber: student.registrationNumber,
      className: `${student.classId.grade} ${student.classId.section}`,
      totalAmount: fee.totalAmount,
      totalPaid: fee.totalPaid,
      balance: fee.balance,
      installments: fee.installments.map((inst) => ({
        name: inst.name,
        month: inst.month,
        startDate: inst.startDate,
        amount: inst.amount,
        amountPaid: inst.amountPaid,
        status: inst.status,
        dueDate: inst.dueDate,
      })),
      payments: fee.payments,
      createdAt: fee.createdAt,
      updatedAt: fee.updatedAt,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching other fees:", error);
    res.status(500).json({
      error: "Server error while fetching other fees",
    });
  }
};

// ============================================
// GET ALL OTHER FEE STRUCTURES (UNCHANGED)
// ============================================
export const getAllOtherFeeStructures = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;

    const structures = await OtherFeeStructure.find({
      admin: adminId,
    })
      .populate("classId", "grade section")
      .sort({ createdAt: -1 });

    if (!structures.length) {
      return res.status(200).json([]);
    }

    const result = structures.map((s) => ({
      _id: s._id,
      classId: s.classId,
      session: s.session,
      title: s.title,
      totalAmount: s.totalAmount,
      monthDetails: s.monthDetails.map((m) => ({
        name: m.name,
        month: m.month,
        startDate: m.startDate,
        dueDate: m.dueDate,
        amount: m.amount,
        lateFine: m.lateFine || 0,
      })),
      createdAt: s.createdAt,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Get Other Fee Structures Error:", error);
    res.status(500).json({
      error: "Failed to fetch other fee structures",
    });
  }
};

// Add installments to existing student fee
export const addInstallmentsToStudentFee = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;
    const { studentFeeId } = req.params;
    const { installmentIndices } = req.body;

    if (!installmentIndices || !installmentIndices.length) {
      return res.status(400).json({ error: "At least one installment index is required" });
    }

    // Find the student fee record
    const studentFee = await StudentOtherFee.findOne({
      _id: studentFeeId,
      admin: adminId,
    }).populate('structureId');

    if (!studentFee) {
      return res.status(404).json({ error: "Student fee record not found" });
    }

    // Get the original structure
    const structure = await OtherFeeStructure.findById(studentFee.structureId);
    if (!structure) {
      return res.status(404).json({ error: "Original fee structure not found" });
    }

    // Check which installments are already present
    const existingInstallmentMonths = new Set(
      studentFee.installments.map(inst => inst.month)
    );

    // Find new installments to add (not already existing)
    const newInstallments = [];
    for (const idx of installmentIndices) {
      const installment = structure.monthDetails[idx];
      if (!existingInstallmentMonths.has(installment.month)) {
        newInstallments.push({
          name: installment.name,
          month: installment.month,
          startDate: installment.startDate,
          dueDate: installment.dueDate,
          amount: installment.amount,
          status: "Pending",
          amountPaid: 0,
        });
      }
    }

    if (newInstallments.length === 0) {
      return res.status(400).json({ 
        error: "All selected installments are already applied to this student" 
      });
    }

    // Calculate new total amount
    const newTotalAmount = studentFee.totalAmount + newInstallments.reduce(
      (sum, inst) => sum + inst.amount, 0
    );

    // Update the student fee record
    studentFee.installments.push(...newInstallments);
    studentFee.totalAmount = newTotalAmount;
    studentFee.netPayable = newTotalAmount;
    studentFee.balance = newTotalAmount - studentFee.totalPaid;
    
    await studentFee.save();

    res.status(200).json({
      success: true,
      message: `${newInstallments.length} new installment(s) added successfully`,
      addedInstallments: newInstallments,
      studentFee: {
        _id: studentFee._id,
        totalAmount: studentFee.totalAmount,
        netPayable: studentFee.netPayable,
        balance: studentFee.balance,
        installments: studentFee.installments,
      },
    });
  } catch (error) {
    console.error("Add Installments Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// In your OtherFeeController.js

// Get all student other fees with populated data
export const getAllStudentOtherFees = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;
    
    const studentFees = await StudentOtherFee.find({ admin: adminId })
      .populate('studentId', 'firstName lastName registrationNumber')
      .populate('classId', 'grade section')
      .populate('structureId', 'title session')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: studentFees,
    });
  } catch (error) {
    console.error("Get all student other fees error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get single student fee by ID
// In your otherFeeController.js
export const getStudentFeeById = async (req, res) => {
  try {
    console.log("=== getStudentFeeById called ===");
    console.log("studentFeeId:", req.params.studentFeeId);
    
    const adminId = req.schoolAdminId;
    const { studentFeeId } = req.params;
    
    console.log("Admin ID:", adminId);
    console.log("Looking for fee with ID:", studentFeeId);
    
    const studentFee = await StudentOtherFee.findOne({ 
      _id: studentFeeId, 
      admin: adminId 
    })
      .populate('studentId', 'firstName lastName registrationNumber')
      .populate('classId', 'grade section')
      .populate('structureId', 'title session monthDetails');
    
    console.log("Found fee:", studentFee);
    
    if (!studentFee) {
      console.log("Fee not found!");
      return res.status(404).json({ error: "Student fee record not found" });
    }
    
    res.status(200).json({
      success: true,
      data: studentFee,
    });
  } catch (error) {
    console.error("Get student fee by id error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get fee structure by ID
export const getOtherFeeStructureById = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;
    const { structureId } = req.params;
    
    const structure = await OtherFeeStructure.findOne({ 
      _id: structureId, 
      admin: adminId 
    });
    
    if (!structure) {
      return res.status(404).json({ error: "Fee structure not found" });
    }
    
    res.status(200).json({
      success: true,
      data: structure,
    });
  } catch (error) {
    console.error("Get fee structure by id error:", error);
    res.status(500).json({ error: error.message });
  }
};
// import { OtherFeeStructure } from "../models/otherFeeStructureSchema.js";
// import { StudentOtherFee } from "../models/studentOtherFeeSchema.js";
// import { Student } from "../models/studentSchema.js";
// import { Class } from "../models/classSchema.js";

// const generateTransactionId = () => {
//   const random = Math.floor(100000 + Math.random() * 900000);
//   const timestamp = Date.now().toString().slice(-6);
//   return `TXN-${random}-${timestamp}`;
// };
// export const createAndAssignOtherFeeStructure = async (req, res) => {
//   try {
//     const adminId = req.schoolAdminId;
//     const { classIds, session, monthDetails } = req.body;

//     // -------------------------------
//     // VALIDATION
//     // -------------------------------
//     if (!classIds?.length) {
//       return res.status(400).json({ error: "At least one class required" });
//     }

//     if (!session) {
//       return res.status(400).json({ error: "Session is required" });
//     }

//     if (!monthDetails?.length) {
//       return res.status(400).json({ error: "monthDetails required" });
//     }

//     // ✅ ensure required fields
//     for (const m of monthDetails) {
//       if (!m.name || !m.month || !m.amount || !m.dueDate) {
//         return res.status(400).json({
//           error: "Each entry must have name, month, amount, dueDate",
//         });
//       }
//     }

//     const createdStructures = [];
//     const allStudentFees = [];

//     for (const classId of classIds) {
//       const classExists = await Class.findOne({
//         _id: classId,
//         admin: adminId,
//       });

//       if (!classExists) continue;

//       const exists = await OtherFeeStructure.findOne({
//         admin: adminId,
//         classId,
//         session,
//       });

//       if (exists) continue;

//       const totalAmount = monthDetails.reduce(
//         (sum, m) => sum + (m.amount || 0),
//         0
//       );

//       const structure = await OtherFeeStructure.create({
//         admin: adminId,
//         classId,
//         session,
//         monthDetails,
//         totalAmount,
//         createdBy: req.user.id,
//       });

//       createdStructures.push(structure);

//       const students = await Student.find({
//         classId,
//         admin: adminId,
//       });

//       const studentFees = students.map((student) => ({
//         admin: adminId,
//         studentId: student._id,
//         classId,
//         session,
//         structureId: structure._id,
//         totalAmount,
//         netPayable: totalAmount,
//         totalPaid: 0,
//         balance: totalAmount,

//         // 🔥 FIX: include startDate
//         installments: monthDetails.map((m) => ({
//           name: m.name,
//           month: m.month,
//           startDate: m.startDate, // ✅ FIXED
//           dueDate: m.dueDate,
//           amount: m.amount,
//           status: "Pending",
//           amountPaid: 0,
//         })),

//         createdBy: req.user.id,
//       }));

//       const created = await StudentOtherFee.insertMany(studentFees);
//       allStudentFees.push(...created);
//     }

//     if (!createdStructures.length) {
//       return res.status(409).json({
//         error: "Already exists or invalid classes",
//       });
//     }

//     res.status(201).json({
//       success: true,
//       session,
//       feeStructures: createdStructures,
//       studentFees: allStudentFees,
//     });
//   } catch (error) {
//     console.error("Create Other Fee Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };
// export const collectOtherFee = async (req, res) => {
//   try {
//     const adminId = req.schoolAdminId;
//     const { studentFeeId } = req.params;
//     const { amount, mode, month, name } = req.body;

//     if (!amount || !mode || !month || !name) {
//       return res.status(400).json({
//         error: "amount, mode, month, name required",
//       });
//     }

//     const feeRecord = await StudentOtherFee.findOne({
//       _id: studentFeeId,
//       admin: adminId,
//     });

//     if (!feeRecord) {
//       return res.status(404).json({ error: "Fee record not found" });
//     }

//     const installment = feeRecord.installments.find(
//       (i) => i.month === month && i.name === name,
//     );

//     if (!installment) {
//       return res.status(400).json({
//         error: "Installment not found",
//       });
//     }

//     installment.amountPaid += amount;

//     installment.status =
//       installment.amountPaid >= installment.amount
//         ? "Paid"
//         : installment.amountPaid > 0
//           ? "Partial"
//           : "Pending";

//     feeRecord.totalPaid += amount;
//     feeRecord.balance = Math.max(feeRecord.netPayable - feeRecord.totalPaid, 0);

//     const transactionId = generateTransactionId();

//     feeRecord.payments.push({
//       amount,
//       mode,
//       month,
//       name,
//       transactionId,
//       collectedBy: req.user.id,
//       collectedAt: new Date(),
//     });

//     await feeRecord.save();

//     res.status(200).json({
//       success: true,
//       transactionId,
//       feeRecord,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
// export const updateOtherFeeStructure = async (req, res) => {
//   try {
//     const { structureId } = req.params;
//     const { monthDetails } = req.body;

//     const structure = await OtherFeeStructure.findOne({
//       _id: structureId,
//       admin: req.schoolAdminId,
//     });

//     if (!structure) {
//       return res.status(404).json({ error: "Not found" });
//     }

//     const newTotal = monthDetails.reduce((sum, m) => sum + m.amount, 0);

//     structure.monthDetails = monthDetails;
//     structure.totalAmount = newTotal;

//     await structure.save();

//     const students = await StudentOtherFee.find({
//       structureId,
//       admin: req.schoolAdminId,
//     });
// for (const s of students) {
//   s.totalAmount = newTotal;
//   s.netPayable = newTotal;
//   s.balance = newTotal - s.totalPaid;

//   // 🔥 FIX: update installments also
//   s.installments = monthDetails.map((m) => ({
//     name: m.name,
//     month: m.month,
//     startDate: m.startDate,
//     dueDate: m.dueDate,
//     amount: m.amount,
//     amountPaid: 0,
//     status: "Pending",
//   }));

//   await s.save();
// }

//     res.status(200).json({
//       success: true,
//       affectedStudents: students.length,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// export const deleteOtherFeeStructure = async (req, res) => {
//   try {
//     const { structureId } = req.params;

//     const hasPayments = await StudentOtherFee.exists({
//       structureId,
//       totalPaid: { $gt: 0 },
//     });

//     if (hasPayments) {
//       return res.status(409).json({
//         error: "Cannot delete, payments exist",
//       });
//     }

//     await StudentOtherFee.deleteMany({ structureId });
//     await OtherFeeStructure.findByIdAndDelete(structureId);

//     res.status(200).json({
//       success: true,
//       message: "Deleted successfully",
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// export const getStudentOtherFeeByRegNo = async (req, res) => {
//   try {
//     const { registrationNumber } = req.params;
//     const adminId = req.schoolAdminId;
//     const role = req.user.role;

//     // -------------------------------
//     // 1. FIND STUDENT
//     // -------------------------------
//     const student = await Student.findOne({
//       registrationNumber,
//       admin: adminId,
//     }).populate("classId", "grade section");

//     if (!student) {
//       return res.status(404).json({ error: "Student not found" });
//     }

//     // -------------------------------
//     // 2. SELF ACCESS CHECK
//     // -------------------------------
//     if (role === "student" && req.user.id !== student.user?.toString()) {
//       return res.status(403).json({
//         error: "You can only view your own fee details",
//       });
//     }

//     // -------------------------------
//     // 3. FETCH OTHER FEES
//     // -------------------------------
//     const otherFees = await StudentOtherFee.find({
//       studentId: student._id,
//       admin: adminId,
//     }).populate("structureId", "title session");

//     if (!otherFees.length) {
//       return res.status(404).json({
//         error: "No other fee records found",
//       });
//     }

//     // -------------------------------
//     // 4. FORMAT RESPONSE
//     // -------------------------------
//     const result = otherFees.map((fee) => ({
//       _id: fee._id,
//       title: fee.structureId?.title || "Other Fees",
//       session: fee.session,

//       studentName: `${student.firstName} ${student.lastName || ""}`.trim(),
//       registrationNumber: student.registrationNumber,
//       className: `${student.classId.grade} ${student.classId.section}`,

//       totalAmount: fee.totalAmount,
//       totalPaid: fee.totalPaid,
//       balance: fee.balance,

//       // 🔥 KEY PART: ALL INSTALLMENTS
//       installments: fee.installments.map((inst) => ({
//         name: inst.name,
//         month: inst.month,
//         startDate: inst.startDate,
//         amount: inst.amount,
//         amountPaid: inst.amountPaid,
//         status: inst.status,
//         dueDate: inst.dueDate,
//       })),

//       // payments history
//       payments: fee.payments,

//       createdAt: fee.createdAt,
//       updatedAt: fee.updatedAt,
//     }));

//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error fetching other fees:", error);
//     res.status(500).json({
//       error: "Server error while fetching other fees",
//     });
//   }
// };
// export const getAllOtherFeeStructures = async (req, res) => {
//   try {
//     const adminId = req.schoolAdminId;

//     const structures = await OtherFeeStructure.find({
//       admin: adminId,
//     })
//       .populate("classId", "grade section") // ✅ IMPORTANT
//       .sort({ createdAt: -1 });

//     if (!structures.length) {
//       return res.status(200).json([]);
//     }

//     // ✅ Format response for frontend
//     const result = structures.map((s) => ({
//       _id: s._id,
//       classId: s.classId, // contains grade + section
//       session: s.session,
//       title: s.title,
//       totalAmount: s.totalAmount,

//       monthDetails: s.monthDetails.map((m) => ({
//         name: m.name,
//         month: m.month,
//         startDate: m.startDate,
//         dueDate: m.dueDate,
//         amount: m.amount,
//         lateFine: m.lateFine || 0,
//       })),

//       createdAt: s.createdAt,
//     }));

//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Get Other Fee Structures Error:", error);
//     res.status(500).json({
//       error: "Failed to fetch other fee structures",
//     });
//   }
// };