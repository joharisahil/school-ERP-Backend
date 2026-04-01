import { FeeStructure } from "../models/feeStructureSchema.js";
import { StudentFee } from "../models/studentFeeSchema.js";
import { Student } from "../models/studentSchema.js"; // assuming you already have this
import { Class } from "../models/classSchema.js";

const generateTransactionId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  const timestamp = Date.now().toString().slice(-6);
  return `TXN-${random}-${timestamp}`;
};

export const getFeeStructures = async (req, res) => {
  try {
    const adminId = req.schoolAdminId;

    const query = { admin: adminId };
    if (req.query.session) {
      query.session = req.query.session;
    }

    const feeStructures = await FeeStructure.find(query).populate(
      "classId",
      "name",
    );

    if (!feeStructures.length) {
      return res.status(404).json({ error: "No fee structures found" });
    }

    res.status(200).json(feeStructures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAndAssignFeeStructure = async (req, res) => {
  try {
    // ✅ School context injected by middleware
    const adminId = req.schoolAdminId;

    const { classIds, session, monthDetails } = req.body;

    if (!classIds?.length) {
      return res.status(400).json({ error: "At least one class required" });
    }

    if (!monthDetails?.length) {
      return res.status(400).json({ error: "monthDetails required" });
    }

    const createdStructures = [];
    const allStudentFees = [];

    for (const classId of classIds) {
      // 🔒 Ensure class belongs to this school
      const classExists = await Class.findOne({
        _id: classId,
        admin: adminId,
      });

      if (!classExists) continue;

      // ❌ Skip if structure already exists for this school + class + session
      const exists = await FeeStructure.findOne({
        admin: adminId,
        classId,
        session,
      });

      if (exists) continue;

      // ✅ Calculate total amount
      const totalStructureAmount = monthDetails.reduce(
        (sum, m) => sum + m.amount,
        0,
      );

      // ✅ Create fee structure
      const feeStructure = await FeeStructure.create({
        admin: adminId,
        classId,
        session,
        monthDetails,
        totalAmount: totalStructureAmount,
        createdBy: req.user.id, // who triggered it (admin or accountant)
      });

      createdStructures.push(feeStructure);

      // ✅ Fetch students of this class (school-scoped)
      const students = await Student.find({
        classId,
        admin: adminId,
      });

      if (!students.length) continue;

      // ✅ Prepare student fee records
      const studentFees = students.map((student) => {
        const installments = monthDetails.map((m) => ({
          month: m.month,
          dueDate: m.dueDate,
          amount: m.amount,
          status: "Pending",
          amountPaid: 0,
        }));

        const totalAmount = installments.reduce(
          (sum, inst) => sum + inst.amount,
          0,
        );

        return {
          admin: adminId,
          studentId: student._id,
          registrationNumber: student.registrationNumber,
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

      const createdStudentFees = await StudentFee.insertMany(studentFees);
      allStudentFees.push(...createdStudentFees);
    }

    if (!createdStructures.length) {
      return res.status(409).json({
        error: "Fee structures already exist or invalid classes selected",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Fee structures created and assigned to students",
      feeStructures: createdStructures,
      studentFees: allStudentFees,
    });
  } catch (error) {
    console.error("Error creating fee structure:", error);
    res.status(500).json({
      error: "Server error while creating fee structures",
    });
  }
};

export const collectFee = async (req, res) => {
  try {
    // ✅ school admin resolved by middleware
    const adminId = req.schoolAdminId;

    const { amount, mode, month, registrationNumber } = req.body;
    const { studentFeeId } = req.params;

    // ------------------------
    // 1. BASIC VALIDATION
    // ------------------------
    if (!amount || !mode || !month) {
      return res.status(400).json({
        error: "Amount, mode, and month are required",
      });
    }

    let feeRecord;

    // ------------------------
    // 2. FETCH FEE RECORD
    // ------------------------
    if (registrationNumber) {
      // 🔒 school-scoped student lookup
      const student = await Student.findOne({
        registrationNumber,
        admin: adminId,
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      feeRecord = await StudentFee.findOne({
        studentId: student._id,
        admin: adminId,
      })
        .populate("studentId", "firstName lastName registrationNumber classId")
        .populate("classId", "grade section")
        .populate("admin", "schoolName");

      if (!feeRecord) {
        return res.status(404).json({
          error: "Fee record not found for this student",
        });
      }
    } else {
      // 🔒 fetch by fee ID + school
      feeRecord = await StudentFee.findOne({
        _id: studentFeeId,
        admin: adminId,
      })
        .populate("studentId", "firstName lastName registrationNumber classId")
        .populate("classId", "grade section")
        .populate("admin", "schoolName");

      if (!feeRecord) {
        return res.status(404).json({
          error: "Student fee record not found",
        });
      }
    }

    // ------------------------
    // 3. FIND INSTALLMENT
    // ------------------------
    const installment = feeRecord.installments.find((i) => i.month === month);

    if (!installment) {
      return res.status(400).json({
        error: `Installment for ${month} not found`,
      });
    }

    // ------------------------
    // 4. MONTH WARNING
    // ------------------------
    const currentMonth = new Date().toLocaleString("en-US", {
      month: "long",
    });

    const warning =
      currentMonth !== month
        ? `Payment month differs from current month (current: ${currentMonth}, requested: ${month})`
        : null;

    // ------------------------
    // 5. UPDATE INSTALLMENT
    // ------------------------
    installment.amountPaid += amount;

    installment.status =
      installment.amountPaid >= installment.amount
        ? "Paid"
        : installment.amountPaid > 0
          ? "Partial"
          : "Pending";

    feeRecord.totalPaid += amount;
    feeRecord.balance = Math.max(feeRecord.netPayable - feeRecord.totalPaid, 0);

    // ------------------------
    // 6. RECORD PAYMENT
    // ------------------------
    const transactionId = generateTransactionId();

    feeRecord.payments.push({
      amount,
      mode,
      month,
      transactionId,
      collectedBy: req.user.id, // ✅ admin OR accountant
      collectedAt: new Date(),
    });

    await feeRecord.save();

    // ------------------------
    // 7. RESPONSE
    // ------------------------
    return res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      warning,
      transactionId,
      schoolName: feeRecord.admin?.schoolName || "N/A",
      registrationNumber:
        feeRecord.registrationNumber || feeRecord.studentId?.registrationNumber,
      studentName: feeRecord.studentId
        ? `${feeRecord.studentId.firstName} ${
            feeRecord.studentId.lastName || ""
          }`.trim()
        : "",
      feeRecord,
    });
  } catch (error) {
    console.error("Error collecting fee:", error);
    res.status(500).json({
      error: "Server error while collecting fee",
    });
  }
};

export const updateFeeStructure = async (req, res) => {
  try {
    const { structureId } = req.params;
    const { monthDetails } = req.body;

    if (!monthDetails || !monthDetails.length) {
      return res.status(400).json({
        error: "monthDetails cannot be empty",
      });
    }

    // ✅ ensure structure belongs to this school
    const structure = await FeeStructure.findOne({
      _id: structureId,
      admin: req.schoolAdminId,
    });

    if (!structure) {
      return res.status(404).json({
        error: "Fee structure not found for this school",
      });
    }

    // 🔁 recalculate totals
    const newTotal = monthDetails.reduce((sum, m) => sum + m.amount, 0);

    structure.monthDetails = monthDetails;
    structure.totalAmount = newTotal;
    await structure.save();

    // 🔄 update related student fees
    const relatedStudents = await StudentFee.find({
      structureId: structure._id,
      admin: req.schoolAdminId,
    });

    for (const student of relatedStudents) {
      const oldTotal = student.totalAmount;

      student.totalAmount = newTotal;
      student.netPayable = newTotal;
      student.balance = Math.max(newTotal - (student.totalPaid || 0), 0);

      // optional audit trail
      student.history.push({
        updatedAt: new Date(),
        reason: "Fee structure updated",
        oldTotal,
        newTotal,
        updatedBy: req.user._id,
      });

      await student.save();
    }

    res.status(200).json({
      success: true,
      message: "Fee structure updated successfully",
      feeStructure: structure,
      affectedStudents: relatedStudents.length,
    });
  } catch (error) {
    console.error("Error updating fee structure:", error);
    res.status(500).json({
      error: "Server error while updating fee structure",
    });
  }
};

export const deleteFeeStructure = async (req, res) => {
  try {
    const { structureId } = req.params;

    // ✅ ensure structure belongs to this school
    const structure = await FeeStructure.findOne({
      _id: structureId,
      admin: req.schoolAdminId,
    });

    if (!structure) {
      return res.status(404).json({
        error: "Fee structure not found for this school",
      });
    }

    // ⚠️ Optional safety check:
    // Prevent deletion if any fee is already collected
    const hasPayments = await StudentFee.exists({
      structureId,
      admin: req.schoolAdminId,
      totalPaid: { $gt: 0 },
    });

    if (hasPayments) {
      return res.status(409).json({
        error: "Cannot delete fee structure because payments already exist",
      });
    }

    // 🧹 delete student fees first
    await StudentFee.deleteMany({
      structureId,
      admin: req.schoolAdminId,
    });

    // 🗑 delete structure
    await structure.deleteOne();

    res.status(200).json({
      success: true,
      message: "Fee structure deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    res.status(500).json({
      error: "Server error while deleting fee structure",
    });
  }
};

export const getFeeStructureById = async (req, res) => {
  try {
    const { classId } = req.params;

    // ✅ Fetch structure scoped to this school/admin
    const structure = await FeeStructure.findOne({
      classId,
      admin: req.schoolAdminId,
    })
      .populate("classId", "name grade section")
      .lean(); // use lean to allow direct manipulation

    if (!structure) {
      return res.status(404).json({
        error: "Fee structure not found for this class",
      });
    }

    // ✅ Flatten the response for frontend
    res.status(200).json({
      success: true,
      _id: structure._id,
      admin: structure.admin,
      classId: structure.classId._id,
      className: structure.classId.name,
      grade: structure.classId.grade,
      section: structure.classId.section,
      session: structure.session,
      monthDetails: structure.monthDetails || [], // safe default
      totalAmount: structure.totalAmount,
      status: structure.status,
      createdBy: structure.createdBy,
      createdAt: structure.createdAt,
      updatedAt: structure.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching fee structure:", error);
    res.status(500).json({
      error: "Server error while fetching fee structure",
    });
  }
};

export const getStudentFeeByRegNo = async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    const role = req.user.role;

    // --------------------------------------------------
    // 1️⃣ Find student (school scoped)
    // --------------------------------------------------
    const student = await Student.findOne({
      registrationNumber,
      admin: req.schoolAdminId, // 🔐 school isolation
    }).populate("classId", "grade section");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // --------------------------------------------------
    // 2️⃣ Student self-access check
    // --------------------------------------------------
    if (role === "student" && req.user.id !== student.user?.toString()) {
      return res
        .status(403)
        .json({ error: "You can only view your own fee details" });
    }

    // --------------------------------------------------
    // 3️⃣ Fetch fee records (school scoped)
    // --------------------------------------------------
    const studentFees = await StudentFee.find({
      studentId: student._id,
      admin: req.schoolAdminId,
    })
      .populate("structureId", "session totalAmount amountPerInstallment")
      .populate("admin", "schoolName");

    if (!studentFees.length) {
      return res
        .status(404)
        .json({ error: "No fee record found for this student" });
    }

    // --------------------------------------------------
    // 4️⃣ Format response
    // --------------------------------------------------
    const result = studentFees.map((fee) => ({
      _id: fee._id,
      session: fee.session,
      schoolName: fee.admin?.schoolName || "N/A",
      registrationNumber: student.registrationNumber,
      studentName: `${student.firstName} ${student.lastName || ""}`.trim(),
      className: `${student.classId.grade} ${student.classId.section}`,
      phone: student.phone,
      totalAmount: fee.totalAmount,
      netPayable: fee.netPayable,
      totalPaid: fee.totalPaid,
      balance: fee.balance,
      installments: fee.installments,
      payments: fee.payments,
      scholarships: fee.scholarships,
      structure: fee.structureId,
      createdAt: fee.createdAt,
      updatedAt: fee.updatedAt,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching student fee by registration number:", error);
    res.status(500).json({
      error: "Server error while fetching student fee",
    });
  }
};

export const getAllStudentFees = async (req, res) => {
  try {
    const role = req.user.role;

    // Only allow admin or accountant
    if (!["admin", "accountant"].includes(role)) {
      return res
        .status(403)
        .json({ error: "Only admins or accountants can view student fees" });
    }

    const schoolAdminId = req.schoolAdminId; // injected by middleware

    // Fetch all student fees for this school
    const allFees = await StudentFee.find({ admin: schoolAdminId })
      .populate("studentId", "firstName lastName registrationNumber classId")
      .populate("classId", "grade section")
      .populate("structureId", "session totalAmount amountPerInstallment");

    res.status(200).json({
      success: true,
      fees: allFees,
    });
  } catch (error) {
    console.error("Error fetching all student fees:", error);
    res.status(500).json({ error: "Server error while fetching student fees" });
  }
};

export const searchFees = async (req, res) => {
  try {
    const role = req.user.role;

    if (!["admin", "accountant"].includes(role)) {
      return res
        .status(403)
        .json({ error: "Only admins or accountants can access this endpoint" });
    }

    const schoolAdminId = req.schoolAdminId; // from middleware
    const {
      grade,
      classId,
      registrationNumber,
      studentName,
      scholarship, // "with" | "without"
      scholarshipType, // "full" | "half" | "custom"
      overdue, // "true" | "false"
      status, // "Paid" | "Partial" | "Pending"
      lateFee, // "true" | "false"
      session,
      minAmount,
      maxAmount,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { admin: schoolAdminId };

    // ======= Class / Grade Filter =======
    if (grade || classId) {
      const classFilter = {};
      if (grade) classFilter.grade = grade;
      if (classId) classFilter._id = classId;

      const classes = await Class.find(classFilter).select("_id");
      if (classes.length) filter.classId = { $in: classes.map((c) => c._id) };
    }

    // ======= Session Filter =======
    if (session) filter.session = session;

    // ======= Net Payable Amount Filter =======
    if (minAmount || maxAmount) {
      filter.netPayable = {};
      if (minAmount) filter.netPayable.$gte = Number(minAmount);
      if (maxAmount) filter.netPayable.$lte = Number(maxAmount);
    }

    // ======= Installments Filter =======
    if (overdue === "true" || status || lateFee === "true") {
      const today = new Date();
      const elemMatch = {};

      if (overdue === "true") {
        elemMatch.status = { $ne: "Paid" };
        elemMatch.dueDate = { $lt: today };
      }

      if (status) elemMatch.status = status;

      if (lateFee === "true") {
        elemMatch.status = "Paid";
        elemMatch.dueDate = { $lt: today };
      }

      filter.installments = { $elemMatch: elemMatch };
    }

    // ======= Scholarship Filter =======
    if (scholarship === "with") filter["scholarships.0"] = { $exists: true };
    else if (scholarship === "without")
      filter["scholarships.0"] = { $exists: false };
    if (scholarshipType) filter["scholarships.type"] = scholarshipType;

    // ======= Student Name / Registration Number Filter =======
    if (registrationNumber || studentName) {
      const studentFilter = {};
      let students = [];

      if (registrationNumber)
        studentFilter.registrationNumber = registrationNumber;

      if (studentName) {
        students = await Student.find({
          $expr: {
            $regexMatch: {
              input: {
                $concat: [
                  { $ifNull: ["$firstName", ""] },
                  " ",
                  { $ifNull: ["$lastName", ""] },
                ],
              },
              regex: studentName.replace(/\s+/g, ".*"),
              options: "i",
            },
          },
          admin: schoolAdminId,
        }).select("_id");
      } else {
        students = await Student.find({
          ...studentFilter,
          admin: schoolAdminId,
        }).select("_id");
      }

      if (students.length)
        filter.studentId = { $in: students.map((s) => s._id) };
      else {
        return res.status(200).json({
          page: Number(page),
          limit: Number(limit),
          totalStudents: 0,
          totalCollected: 0,
          totalPending: 0,
          totalLateFeeSubmitters: 0,
          fees: [],
        });
      }
    }

    // ======= Pagination =======
    const skip = (page - 1) * limit;

    // ======= Fetch Fees =======
    const fees = await StudentFee.find(filter)
      .populate("studentId", "firstName lastName registrationNumber classId")
      .populate("classId", "grade section")
      .populate("structureId", "session totalAmount amountPerInstallment")
      .populate("admin", "schoolName")
      .skip(skip)
      .limit(Number(limit));

    // ======= KPI Totals =======
    const totalStudents = await StudentFee.countDocuments(filter);
    let totalCollected = 0;
    let totalPending = 0;
    let totalLateFeeSubmitters = 0;
    const today = new Date();

    fees.forEach((fee) => {
      totalCollected += fee.totalPaid || 0;
      totalPending += fee.balance || 0;

      const hasLateFee = fee.installments.some(
        (inst) => inst.status === "Paid" && inst.dueDate < today,
      );
      if (hasLateFee) totalLateFeeSubmitters += 1;
    });

    res.status(200).json({
      page: Number(page),
      limit: Number(limit),
      totalStudents,
      totalCollected,
      totalPending,
      totalLateFeeSubmitters,
      fees,
    });
  } catch (error) {
    console.error("Error searching fees:", error);
    res.status(500).json({ error: "Server error while searching fees" });
  }
};


//fixed

/*
v1 without roles
break
*/

// export const createAndAssignFeeStructure = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res
//         .status(403)
//         .json({ error: "Only admins can create fee structures" });
//     }

//     const { classIds, session, monthDetails } = req.body;

//     if (!classIds?.length) {
//       return res.status(400).json({ error: "At least one class required" });
//     }
//     if (!monthDetails?.length) {
//       return res.status(400).json({ error: "monthDetails required" });
//     }

//     const createdStructures = [];
//     const allStudentFees = [];

//     for (const classId of classIds) {
//       // Skip if structure already exists
//       const exists = await FeeStructure.findOne({ classId, session });
//       if (exists) continue;

//       // Create new fee structure
//       const totalStructureAmount = monthDetails.reduce(
//         (sum, m) => sum + m.amount,
//         0
//       );
//       const feeStructure = await FeeStructure.create({
//         admin: req.user.id,
//         classId,
//         session,
//         monthDetails,
//         totalAmount: totalStructureAmount,
//         createdBy: req.user.id,
//       });
//       createdStructures.push(feeStructure);

//       // Fetch students of this class
//       const students = await Student.find({ classId });
//       if (!students.length) continue;

//       // Prepare student fees
//       const studentFees = students.map((student) => {
//         const installments = monthDetails.map((m) => ({
//           month: m.month,
//           dueDate: m.dueDate,
//           amount: m.amount,
//           status: "Pending",
//           amountPaid: 0,
//         }));

//         const totalAmount = installments.reduce(
//           (sum, inst) => sum + inst.amount,
//           0
//         );

//         return {
//           admin: req.user.id,
//           studentId: student._id,
//           registrationNumber: student.registrationNumber, // ✅ added field here
//           classId,
//           session,
//           structureId: feeStructure._id,
//           totalAmount,
//           netPayable: totalAmount,
//           totalPaid: 0,
//           balance: totalAmount,
//           installments,
//           createdBy: req.user.id,
//         };
//       });

//       // Insert all student fees
//       const createdStudentFees = await StudentFee.insertMany(studentFees);
//       allStudentFees.push(...createdStudentFees);
//     }

//     if (!createdStructures.length) {
//       return res.status(409).json({
//         error: "Fee structures already exist for all selected classes",
//       });
//     }

//     return res.status(201).json({
//       message: "Fee structures created and assigned to students",
//       feeStructures: createdStructures,
//       studentFees: allStudentFees,
//     });
//   } catch (error) {
//     console.error("Error creating fee structure:", error);
//     res
//       .status(500)
//       .json({ error: "Server error while creating fee structures" });
//   }
// };

/*break*/

// export const collectFee = async (req, res) => {
//   try {
//      const adminId = req.schoolAdminId;

//     const { amount, mode, month, registrationNumber } = req.body;
//     const { studentFeeId } = req.params;

//     // Basic validation
//     if (!amount || !mode || !month) {
//       return res
//         .status(400)
//         .json({ error: "Amount, mode, and month are required" });
//     }

//     let feeRecord;

//     // 🔹 Fetch by registration number if provided
//     if (registrationNumber) {
//       const student = await Student.findOne({ registrationNumber });
//       if (!student) return res.status(404).json({ error: "Student not found" });

//       feeRecord = await StudentFee.findOne({ studentId: student._id })
//         .populate("studentId", "firstName lastName registrationNumber classId")
//         .populate("classId", "grade section")
//         .populate("admin", "schoolName");
//       if (!feeRecord)
//         return res
//           .status(404)
//           .json({ error: "Fee record not found for this student" });
//     } else {
//       // 🔹 Otherwise fetch by studentFeeId
//       feeRecord = await StudentFee.findById(studentFeeId)
//         .populate("studentId", "firstName lastName registrationNumber classId")
//         .populate("classId", "grade section");
//       if (!feeRecord)
//         return res.status(404).json({ error: "Student fee record not found" });
//     }

//     // Find installment
//     const installment = feeRecord.installments.find((i) => i.month === month);
//     if (!installment)
//       return res
//         .status(400)
//         .json({ error: `Installment for ${month} not found` });

//     // Warn if month differs from current
//     const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
//     const warning =
//       currentMonth !== month
//         ? `Payment month differs from current month (current: ${currentMonth}, requested: ${month})`
//         : null;

//     // Update installment & totals
//     installment.amountPaid += amount;
//     installment.status =
//       installment.amountPaid >= installment.amount
//         ? "Paid"
//         : installment.amountPaid > 0
//         ? "Partial"
//         : "Pending";

//     feeRecord.totalPaid += amount;
//     feeRecord.balance = Math.max(feeRecord.netPayable - feeRecord.totalPaid, 0);

//     // Generate transaction ID & save
//     const transactionId = generateTransactionId();
//     feeRecord.payments.push({ amount, mode, month, transactionId });

//     await feeRecord.save();

//     // Return clean response
//     return res.status(200).json({
//       message: "Payment recorded successfully",
//       warning,
//       transactionId,
//       schoolName: feeRecord.admin?.schoolName || "N/A",
//       registrationNumber:
//         feeRecord.registrationNumber || feeRecord.studentId?.registrationNumber,
//       studentName: feeRecord.studentId
//         ? `${feeRecord.studentId.firstName} ${
//             feeRecord.studentId.lastName || ""
//           }`.trim()
//         : "",
//       feeRecord,
//     });
//   } catch (error) {
//     console.error("Error collecting fee:", error);
//     res.status(500).json({ error: "Server error while collecting fee" });
//   }
// };

/*break*/

// export const updateFeeStructure = async (req, res) => {
//   try {
//     // 1️⃣ Check admin role
//     if (req.user.role !== "admin") {
//       return res
//         .status(403)
//         .json({ error: "Only admins can update fee structures" });
//     }

//     // 2️⃣ Extract params and body
//     const { structureId } = req.params; // ✅ make sure route uses :structureId
//     const { monthDetails } = req.body;

//     if (!monthDetails || !monthDetails.length) {
//       return res.status(400).json({ error: "monthDetails cannot be empty" });
//     }

//     // 3️⃣ Find the existing fee structure
//     const structure = await FeeStructure.findById(structureId);
//     if (!structure) {
//       return res.status(404).json({ error: "Fee structure not found" });
//     }

//     // 4️⃣ Update month details and recalculate total
//     structure.monthDetails = monthDetails;
//     structure.totalAmount = monthDetails.reduce((sum, m) => sum + m.amount, 0);
//     await structure.save();

//     // 5️⃣ Update all related student fee records
//     const relatedStudents = await StudentFee.find({
//       structureId: structure._id,
//     });

//     for (const student of relatedStudents) {
//       const oldTotal = student.totalAmount;
//       const newTotal = structure.totalAmount;

//       // Update student fee details
//       student.totalAmount = newTotal;
//       student.balance = newTotal - (student.totalPaid || 0);

//       // Add a record in history
//       student.history.push({
//         updatedAt: new Date(),
//         reason: "Fee structure revised by admin",
//         oldTotal: oldTotal,
//         newTotal: newTotal,
//         adminId: req.user._id, // optional: track who updated
//       });

//       await student.save();
//     }

//     // 6️⃣ Send response
//     res.status(200).json({
//       message: "Fee structure and related student fees updated successfully",
//       feeStructure: structure,
//       updatedStudents: relatedStudents.length,
//     });
//   } catch (error) {
//     console.error("Error updating fee structure:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

/*break*/

// export const deleteFeeStructure = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res
//         .status(403)
//         .json({ error: "Only admins can delete fee structures" });
//     }

//     const { structureId } = req.params;

//     const structure = await FeeStructure.findById(structureId);
//     if (!structure) {
//       return res.status(404).json({ error: "Fee structure not found" });
//     }

//     // Optional: remove all student fee records linked to this structure
//     await StudentFee.deleteMany({ structureId });

//     await structure.deleteOne();

//     res.status(200).json({ message: "Fee structure deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

/*break*/
// Get Fee Structure by ID (Admin only)

// export const getFeeStructureById = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res
//         .status(403)
//         .json({ error: "Only admins can view fee structures" });
//     }

//     const { classId } = req.params;
//     //console.log("class id",classId);
//     //const structure = await FeeStructure.findById(classId).populate("classId", "name");
//     const structure = await FeeStructure.findOne({ classId }).populate(
//       "classId",
//       "name"
//     );
//     if (!structure)
//       return res.status(404).json({ error: "Fee structure not found" });

//     res.status(200).json(structure);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
/*break */

// Get Fee Record for a Student (Admin + Student themselves)
// export const getStudentFeeByRegNo = async (req, res) => {
//   try {
//     const { registrationNumber } = req.params;

//     // 1️⃣ Find the student using registration number
//     const student = await Student.findOne({ registrationNumber }).populate(
//       "classId",
//       "grade section"
//     );

//     if (!student) {
//       return res.status(404).json({ error: "Student not found" });
//     }

//     // 2️⃣ Authorization check
//     if (req.user.role !== "admin" && req.user.id !== student._id.toString()) {
//       return res
//         .status(403)
//         .json({ error: "Unauthorized to view this student's fee" });
//     }

//     // 3️⃣ Fetch student fees
//     const studentFees = await StudentFee.find({
//       studentId: student._id,
//     })
//       .populate("structureId", "session totalAmount amountPerInstallment")
//       .populate("admin", "schoolName");

//     if (!studentFees.length) {
//       return res
//         .status(404)
//         .json({ error: "No fee record found for this student" });
//     }

//     // 4️⃣ Format the response
//     const result = studentFees.map((fee) => ({
//       _id: fee._id,
//       session: fee.session,
//       schoolName: fee.admin?.schoolName || "N/A",
//       registrationNumber: student.registrationNumber,
//       studentName: `${student.firstName} ${student.lastName || ""}`.trim(),
//       className: `${student.classId.grade} ${student.classId.section}`,
//       phone: student.phone,
//       totalAmount: fee.totalAmount,
//       netPayable: fee.netPayable,
//       totalPaid: fee.totalPaid,
//       balance: fee.balance,
//       installments: fee.installments,
//       payments: fee.payments,
//       scholarships: fee.scholarships,
//       structure: fee.structureId,
//       createdAt: fee.createdAt,
//       updatedAt: fee.updatedAt,
//     }));

//     return res.status(200).json(result);
//   } catch (error) {
//     console.error("Error fetching student fee by registration number:", error);
//     res.status(500).json({ error: "Server error while fetching student fee" });
//   }
// };

// Get All Students’ Fee Records (Admin only)
// export const getAllStudentFees = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res
//         .status(403)
//         .json({ error: "Only admins can view all student fees" });
//     }

//     const allFees = await StudentFee.find({ admin: req.user.id })
//       .populate("studentId", "name rollNo classId")
//       .populate("classId", "name")
//       .populate("structureId", "session totalAmount amountPerInstallment");

//     res.status(200).json(allFees);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const searchFees = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res
//         .status(403)
//         .json({ error: "Only admins can access this endpoint" });
//     }

//     const {
//       grade,
//       classId,
//       registrationNumber,
//       studentName,
//       scholarship, // "with" | "without"
//       scholarshipType, // "full" | "half" | "custom"
//       overdue, // "true" | "false"
//       status, // "Paid" | "Partial" | "Pending"
//       lateFee, // "true" | "false"
//       session,
//       minAmount,
//       maxAmount,
//       page = 1,
//       limit = 50,
//     } = req.query;

//     const filter = { admin: req.user.id };

//     // ======= Class / Grade Filter =======
//     if (grade || classId) {
//       const classFilter = {};
//       if (grade) classFilter.grade = grade;
//       if (classId) classFilter._id = classId;

//       const classes = await Class.find(classFilter).select("_id");
//       if (classes.length) filter.classId = { $in: classes.map((c) => c._id) };
//     }

//     // ======= Session Filter =======
//     if (session) filter.session = session;

//     // ======= Net Payable Amount Filter =======
//     if (minAmount || maxAmount) {
//       filter.netPayable = {};
//       if (minAmount) filter.netPayable.$gte = Number(minAmount);
//       if (maxAmount) filter.netPayable.$lte = Number(maxAmount);
//     }

//     // ======= Installments Filter =======
//     if (overdue === "true" || status || lateFee === "true") {
//       const today = new Date();
//       const elemMatch = {};

//       if (overdue === "true") {
//         elemMatch.status = { $ne: "Paid" };
//         elemMatch.dueDate = { $lt: today };
//       }

//       if (status) {
//         elemMatch.status = status;
//       }

//       if (lateFee === "true") {
//         elemMatch.status = "Paid";
//         elemMatch.dueDate = { $lt: today };
//       }

//       filter.installments = { $elemMatch: elemMatch };
//     }

//     // ======= Scholarship Filter =======
//     if (scholarship === "with") filter["scholarships.0"] = { $exists: true };
//     else if (scholarship === "without")
//       filter["scholarships.0"] = { $exists: false };
//     if (scholarshipType) filter["scholarships.type"] = scholarshipType;

//     // ======= Student Name / Registration Number Filter =======
//     if (registrationNumber || studentName) {
//       const studentFilter = {};
//       let students = [];

//       if (registrationNumber) {
//         studentFilter.registrationNumber = registrationNumber;
//       }

//       if (studentName) {
//         students = await Student.find({
//           $expr: {
//             $regexMatch: {
//               input: {
//                 $concat: [
//                   { $ifNull: ["$firstName", ""] },
//                   " ",
//                   { $ifNull: ["$lastName", ""] },
//                 ],
//               },
//               regex: studentName.replace(/\s+/g, ".*"),
//               options: "i",
//             },
//           },
//         }).select("_id");
//       } else {
//         students = await Student.find(studentFilter).select("_id");
//       }

//       if (students.length) {
//         filter.studentId = { $in: students.map((s) => s._id) };
//       } else {
//         return res.status(200).json({
//           page: Number(page),
//           limit: Number(limit),
//           totalStudents: 0,
//           totalCollected: 0,
//           totalPending: 0,
//           totalLateFeeSubmitters: 0,
//           fees: [],
//         });
//       }
//     }

//     // ======= Pagination =======
//     const skip = (page - 1) * limit;

//     // ======= Fetch Fees =======
//     const fees = await StudentFee.find(filter)
//       .populate("studentId", "firstName lastName registrationNumber classId")
//       .populate("classId", "grade section")
//       .populate("structureId", "session totalAmount amountPerInstallment")
//       .populate("admin", "schoolName ")
//       .skip(skip)
//       .limit(Number(limit));

//     // ======= KPI Totals =======
//     const totalStudents = await StudentFee.countDocuments(filter);
//     let totalCollected = 0;
//     let totalPending = 0;
//     let totalLateFeeSubmitters = 0;
//     const today = new Date();

//     fees.forEach((fee) => {
//       totalCollected += fee.totalPaid || 0;
//       totalPending += fee.balance || 0;

//       // Count late fee submitters
//       const hasLateFee = fee.installments.some(
//         (inst) => inst.status === "Paid" && inst.dueDate < today
//       );
//       if (hasLateFee) totalLateFeeSubmitters += 1;
//     });

//     res.status(200).json({
//       page: Number(page),
//       limit: Number(limit),
//       totalStudents,
//       totalCollected,
//       totalPending,
//       totalLateFeeSubmitters,
//       fees,
//     });
//   } catch (error) {
//     console.error("Error searching fees:", error);
//     res.status(500).json({ error: "Server error while searching fees" });
//   }
// };

//v2
//new controller for roles support
//check router for giving acces to other roles
