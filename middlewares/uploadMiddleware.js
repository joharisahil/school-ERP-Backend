// middlewares/uploadMiddleware.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads/logos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
  if (file.fieldname === "logo") {
    const savePath = path.join(process.cwd(), "uploads/logos"); // ✅ define here
    console.log("📁 Saving logo to:", savePath); // ✅ now works
    cb(null, savePath);
  } else {
    const savePath = path.join(process.cwd(), "uploads");
    console.log("📁 Saving file to:", savePath);
    cb(null, savePath);
  }
},
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = file.fieldname === "logo" ? "logo" : "file";
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // For logo uploads, only allow images
  if (file.fieldname === "logo") {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    return cb(new Error("Only image files are allowed for logo"));
  }
  
  // For other uploads, accept more file types
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

export const uploadLogo = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for logo
  fileFilter,
}).single("logo");

export const uploadMultiple = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).array("files", 10);