// middlewares/checkAdminStatus.js
import jwt from "jsonwebtoken";
import { User } from "../models/userRegisterSchema.js";

export const checkAdminStatus = async (req, res, next) => {
  try {
    // 1️⃣ Get token from cookie OR header
    const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    // 2️⃣ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }

    // 3️⃣ Attach user info to req
    req.user = decoded; // { id, email, role }

    // 4️⃣ Fetch user from DB
    const user = await User.findById(req.user.id); // Use decoded id
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 5️⃣ Check if admin is disabled
    if (user.role === "admin" && user.isActive === false) {
      return res.status(403).json({ success: false, message: "Admin account is disabled by Super Admin" });
    }

    // 6️⃣ Check if admin plan expired
    if (user.role === "admin" && user.isPlanExpired === true) {
      return res.status(403).json({ success: false, message: "Your plan has expired. Please renew to continue." });
    }

    next(); // ✅ all good, proceed
  } catch (err) {
    console.error("Error in checkAdminStatus middleware:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
