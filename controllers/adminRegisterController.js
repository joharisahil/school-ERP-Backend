import { User } from "../models/userRegisterSchema.js";
import { handleValidationError } from "../middlewares/errorHandler.js";
import { Student } from "../models/studentSchema.js";
import { Teacher } from "../models/teacherSchema.js";
import { Class } from "../models/classSchema.js"; // or Subject model if you use that
import { StudentFee } from "../models/studentFeeSchema.js";


// export const adminRegister = async (req, res, next) => {
//   console.log(req.body);
//   const { email, password, role } = req.body;
//   try {
//     if (!email || !password || !role) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Please Fill Form!" });
//       handleValidationError("Please Fill Form!", 400);
//     }

//     // Check if an admin with the same email already exists
//     const existingAdmin = await User.findOne({ email, role: "admin" });
//     if (existingAdmin) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Admin already exists" });
//     }

//     await User.create({ email, password, role });
//     res.status(200).json({
//       success: true,
//       message: "Admin Created!",
//     });
//   } catch (err) {
//     next(err);
//   }
// };


export const adminRegister = async (req, res, next) => {
  console.log(req.body);
  const { email, password, role, schoolName, planDays } = req.body;

  try {
    // ✅ Validate required fields
    if (!email || !password || !role || !schoolName) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all required fields!" });
    }

    // ✅ Check if an admin with the same email already exists
    const existingAdmin = await User.findOne({ email, role: "admin" });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin already exists" });
    }

    // ✅ Ensure planDays never exceeds 360
    const validPlanDays = planDays && planDays <= 360 ? planDays : 360;

    // ✅ Create new admin
    await User.create({
      email,
      password,
      role,
      schoolName,
      planDays: validPlanDays,
    });

    res.status(200).json({
      success: true,
      message: "Admin registered successfully!",
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};


export const logout = async (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};


export const getAdminKPI = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const admin = await User.findById(adminId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // ✅ Count totals (school-level)
    const [studentsCount, teachersCount, classesCount] = await Promise.all([
      Student.countDocuments({ admin: adminId }),
      Teacher.countDocuments({ admin: adminId }),
      Class.countDocuments({ admin: adminId }),
    ]);

    // ✅ Calculate total pending fees from StudentFee collection
    const studentFees = await StudentFee.find({ admin: adminId });

    let totalPending = 0;
    let totalCollected = 0;
    let check=0;
    let netPayabletotal=0;
    studentFees.forEach((fee) => {
      // Use the `balance` field directly (already stores remaining fee)
      totalPending += fee.balance || 0;
      netPayabletotal +=fee.netPayable || 0;
      fee.payments.forEach((p) => {
        totalCollected += p.amount || 0;
      });
    });
    check = netPayabletotal - (totalCollected+totalPending);
    // ✅ School info from admin profile
    const { schoolName, planDays } = admin;

    res.status(200).json({
      success: true,
      data: {
        schoolName,
        planDays,
        studentsCount,
        teachersCount,
        classesCount,
        feesPending: totalPending,
        feesCollected : totalCollected,
        feesCheck :check,
      },
    });
  } catch (err) {
    console.error("Error fetching KPI:", err);
    next(err);
  }
};
