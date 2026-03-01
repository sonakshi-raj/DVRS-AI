import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import Resume from "../models/Resume.js";
import aiService from "../services/aiService.js";
import fs from "fs";

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

// Get all resumes for logged-in user
router.get("/list", protect, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .select('-parsedData') // Exclude large parsed data from list
      .sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes
    });
  } catch (error) {
    console.error('❌ Error fetching resumes:', error);
    res.status(500).json({
      success: false,
      msg: "Failed to fetch resumes",
      error: error.message
    });
  }
});

// Get single resume by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        msg: "Resume not found"
      });
    }

    // Verify ownership
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        msg: "Not authorized to access this resume"
      });
    }

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (error) {
    console.error('❌ Error fetching resume:', error);
    res.status(500).json({
      success: false,
      msg: "Failed to fetch resume",
      error: error.message
    });
  }
});

// Upload and parse resume
router.post(
  "/upload",
  protect,
  upload.single("resume"),
  async (req, res) => {
    try {
      const file = req.file;
      const { displayName, category } = req.body;
      
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
        displayName: displayName || file.originalname,
        category: category || 'other',
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
        data: resume
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

// Update resume (name, category)
router.put("/:id", protect, async (req, res) => {
  try {
    const { displayName, category } = req.body;
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        msg: "Resume not found"
      });
    }

    // Verify ownership
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        msg: "Not authorized to update this resume"
      });
    }

    if (displayName) resume.displayName = displayName;
    if (category) resume.category = category;

    await resume.save();

    res.status(200).json({
      success: true,
      msg: "Resume updated successfully",
      data: resume
    });
  } catch (error) {
    console.error('❌ Error updating resume:', error);
    res.status(500).json({
      success: false,
      msg: "Failed to update resume",
      error: error.message
    });
  }
});

// Delete resume
router.delete("/:id", protect, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        msg: "Resume not found"
      });
    }

    // Verify ownership
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        msg: "Not authorized to delete this resume"
      });
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(resume.filePath)) {
        fs.unlinkSync(resume.filePath);
      }
    } catch (fsError) {
      console.error('File deletion failed:', fsError);
      // Continue with DB deletion even if file deletion fails
    }

    await resume.deleteOne();

    res.status(200).json({
      success: true,
      msg: "Resume deleted successfully"
    });
  } catch (error) {
    console.error('❌ Error deleting resume:', error);
    res.status(500).json({
      success: false,
      msg: "Failed to delete resume",
      error: error.message
    });
  }
});

export default router;   // ✅ THIS LINE IS CRITICAL
