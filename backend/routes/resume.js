import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// Upload resume
router.post(
  "/upload",
  authMiddleware,
  upload.single("resume"),
  (req, res) => {
    res.status(200).json({
      msg: "Resume uploaded successfully",
      file: req.file.filename
    });
  }
);

export default router;   // ✅ THIS LINE IS CRITICAL
