import express from "express";
import { config } from "dotenv";
import cors from "cors";

import { dbConnection } from "./database/dbConnection.js";
import studentRouter from "./router/studentRouter.js";
import teacherRouter from "./router/teacherRouter.js";
import assignmentRouter from "./router/assignmentRouter.js";

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

const app = express();
config({ path: "./config/config.env" });

// app.use(
//     cors({
//         origin: [process.env.FRONTEND_URL],
//         methods: ["GET", "POST", "PUT", "DELETE"],

//     })
// );

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());

app.use((err, req, res, next) => {
  errorHandler(err, req, res, next);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/students", studentRouter);
app.use("/api/v1/teachers", teacherRouter);
app.use("/api/v1/assignments", assignmentRouter);

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
app.get("/api/v1/profile", verifyToken, (req, res) => {
  res.json({
    id: req.user.id,
    role: req.user.role,
    email: req.user.email,
  });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ message: "✅ Server is alive", time: new Date().toISOString() });
});

dbConnection();

export default app;
