import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import Resume from "../models/Resume.js";
import aiService from "../services/aiService.js";

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// Upload and parse resume
router.post(
  "/upload",
  protect,
  upload.single("resume"),
  async (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({
          success: false,
          msg: "No file uploaded"
        });
      }

      // Try to parse with AI service
      let parsedData = null;
      let isParsed = false;
      
      try {
        const aiResponse = await aiService.parseResume(file.path);
        parsedData = aiResponse.data;
        isParsed = true;
      } catch (aiError) {
        console.error('AI parsing failed:', aiError.message);
        // Continue without parsed data - still save the file
      }

      // Save resume to database
      const resume = await Resume.create({
        userId: req.user._id,
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
        parsedData: parsedData,
        isParsed: isParsed
      });

      res.status(200).json({
        success: true,
        msg: isParsed ? "Resume uploaded and parsed successfully" : "Resume uploaded (parsing failed)",
        data: {
          resumeId: resume._id,
          fileName: file.filename,
          isParsed: isParsed,
          parsedData: parsedData
        }
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        success: false,
        msg: "Resume upload failed",
        error: error.message
      });
    }
  }
);

export default router;   // ✅ THIS LINE IS CRITICAL
