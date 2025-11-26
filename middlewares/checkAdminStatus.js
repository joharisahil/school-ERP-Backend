import { User } from "../models/userRegisterSchema.js";

export const checkAdminStatus = async (req, res, next) => {
    console.log("here i m doing chull");
  try {
    const user = await User.findById({ email: req.user.email });
    console.log(user);

    if (!user)
      return res.status(404).json({ error: "User not found" });

    // If admin is disabled
    if (user.role === "admin" && user.isActive === false) {
      return res.status(403).json({ error: "Admin account is disabled by Super Admin" });
    }

    // If plan expired
    if (user.role === "admin" && user.isPlanExpired === true) {
      return res.status(403).json({
        error: "Your plan has expired. Please renew to continue."
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
