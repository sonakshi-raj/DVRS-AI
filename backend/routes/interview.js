import express from 'express';
import multer from 'multer';
const router = express.Router();
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  startSession,
  completeSession,
  addQuestionAnswer,
  getNextQuestion,
  deleteSession,
  uploadVideo,
  analyzeInterview
} from '../controllers/interviewController.js';
import { protect } from '../middleware/auth.js';

// Multer config for video upload
const videoStorage = multer.diskStorage({
  destination: 'uploads/videos/',
  filename: (req, file, cb) => {
    cb(null, `interview-${Date.now()}.webm`);
  }
});

const videoUpload = multer({ 
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// All routes are protected (require authentication)
router.use(protect);

// Session CRUD operations
router.post('/session', createSession);
router.get('/sessions', getSessions);
router.get('/session/:id', getSessionById);
router.put('/session/:id', updateSession);
router.delete('/session/:id', deleteSession);

// Session state management
router.put('/session/:id/start', startSession);
router.put('/session/:id/complete', completeSession);

// Question generation and Q&A
router.get('/session/:id/next-question', getNextQuestion);
router.post('/session/:id/qa', addQuestionAnswer);

// Video upload
router.post('/session/:id/upload-video', videoUpload.single('video'), uploadVideo);

// Mock analysis endpoint
router.post('/session/:id/analyze', analyzeInterview);

export default router;
