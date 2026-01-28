import express from 'express';
const router = express.Router();
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  startSession,
  completeSession,
  addQuestionAnswer,
  deleteSession
} from '../controllers/interviewController.js';
import { protect } from '../middleware/auth.js';

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

// Add Q&A to session
router.post('/session/:id/qa', addQuestionAnswer);

export default router;
