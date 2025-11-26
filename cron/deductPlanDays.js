import cron from "node-cron";
import { User } from "../models/userRegisterSchema.js";

// Run at 12:00 AM IST daily
cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      console.log(" Running daily planDays deduction...");

      //  Deduct plan days ONLY if greater than 0
      const deductResult = await User.updateMany(
        { role: "admin", planDays: { $gt: 0 }, isActive: true },
        { $inc: { planDays: -1 } }
      );

      console.log(` Deducted plan days for: ${deductResult.modifiedCount} admins`);

      // Mark plan expired when planDays hits 0
      const expireResult = await User.updateMany(
        { role: "admin", planDays: { $lte: 0 } },
        {
          $set: {
            planDays: 0,
            isPlanExpired: true,
            isActive: false,
          },
        }
      );

      console.log(` Plan expired & disabled: ${expireResult.modifiedCount} admins`);
    } catch (error) {
      console.error("Error in planDays cron job:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata", // IST
  }
);
