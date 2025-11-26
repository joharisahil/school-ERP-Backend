import express from "express";
import { config } from "dotenv";
import cors from "cors";

import { dbConnection } from "./database/dbConnection.js";
import studentRouter from "./router/studentRouter.js";
import teacherRouter from "./router/teacherRouter.js";
import assignmentRouter from "./router/assignmentRouter.js";
import superAdminRouter from "./router/superAdminRouter.js";
import announcementRouter from "./router/announcementRouter.js";
import classRouter from "./router/classRouter.js";
import subjectRouter from "./router/subjectRouter.js";
import libraryRouter from "./router/libraryRouter.js";
import timetableRouter from "./router/timetableRoutes.js";
import feeRouter from "./router/feeRouter.js";

import eventsRouter from "./router/eventsRouter.js";
import examRouter from "./router/examRouter.js";
import attendanceRouter from "./router/attendanceRouter.js";
import usersRouter from "./router/usersRouter.js";
import adminRegisterRouter from "./router/adminRegisterRouter.js";
import protectedRoutes from "./router/protectedRoutes.js";

import { errorHandler } from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";
import { verifyToken } from "./middlewares/authMiddleware.js";
import "./cron/deleteOldTeachers.js";
import "./cron/deductPlanDays.js";
const app = express();
config({ path: "./config/config.env" });

// --------------------
// CORS CONFIG (FIXED)
// --------------------
//const allowedOrigins = process.env.FRONTEND_URL.split(",");

const allowedOrigins = (process.env.FRONTEND_URL || "").split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow tools & server-side calls
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// --------------------
// CORE MIDDLEWARES
// --------------------
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// ROUTES
// --------------------
app.use("/api/v1/students", studentRouter);
app.use("/api/v1/teachers", teacherRouter);
app.use("/api/v1/assignments", assignmentRouter);
app.use("/api/v1/superadmin", superAdminRouter);
app.use("/api/v1/announcements", announcementRouter);
app.use("/api/v1/class", classRouter);
app.use("/api/v1/subject", subjectRouter);
app.use("/api/v1/library", libraryRouter);
app.use("/api/v1/events", eventsRouter);
app.use("/api/v1/exam", examRouter);
app.use("/api/v1/timetable", timetableRouter);
app.use("/api/v1/attendance", attendanceRouter);

app.use("/api/v1/fees", feeRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/dashboard", protectedRoutes);
app.use("/api/v1/register", adminRegisterRouter);

// Profile route
app.get("/api/v1/profile", verifyToken, (req, res) => {
  res.json({
    id: req.user.id,
    role: req.user.role,
    email: req.user.email,
  });
});

// Health route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    message: "✅ Server is alive",
    time: new Date().toISOString(),
  });
});

// --------------------
// ERROR HANDLER (MUST BE LAST)
// --------------------
app.use(errorHandler);

// DB Connection
dbConnection();

export default app;
