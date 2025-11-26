import cron from "node-cron";
import { Teacher } from "../models/teacherSchema.js";

// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  const thirtyDaysAgo = new Date(Date.now() -  10 * 24 * 60 * 60 * 1000);

  try {
    const result = await Teacher.deleteMany({
      isDeleted: true,
      deletedAt: { $lte: thirtyDaysAgo },
    });

    if (result.deletedCount > 0) {
      //console.log(`🧹 Hard deleted ${result.deletedCount} old teacher(s).`);
    }
  } catch (error) {
    //console.error("Error cleaning up deleted teachers:", error);
  }
});
