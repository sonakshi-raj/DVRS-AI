import InterviewSession from '../models/InterviewSession.js';
import Resume from '../models/Resume.js';
import InterviewEngine from "../engine/interviewEngine.js";
import aiService from '../services/aiService.js';


// @desc    Create a new interview session
// @route   POST /api/interview/session
// @access  Private
const createSession = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    const session = await InterviewSession.create({
      userId: req.user._id,
      resumeId,
      jobDescription,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all interview sessions for logged-in user
// @route   GET /api/interview/sessions
// @access  Private
const getSessions = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single interview session by ID
// @route   GET /api/interview/session/:id
// @access  Private
const getSessionById = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Check if session belongs to user
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this session'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update interview session
// @route   PUT /api/interview/session/:id
// @access  Private
const updateSession = async (req, res) => {
  try {
    let session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Check if session belongs to user
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this session'
      });
    }

    // Update session
    session = await InterviewSession.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start interview session
// @route   PUT /api/interview/session/:id/start
// @access  Private
const startSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Check if session belongs to user
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this session'
      });
    }

    session.status = 'in-progress';
    session.startedAt = Date.now();
    await session.save();

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete interview session
// @route   PUT /api/interview/session/:id/complete
// @access  Private
const completeSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Check if session belongs to user
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this session'
      });
    }

    session.status = 'completed';
    session.completedAt = Date.now();
    await session.save();

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add question and answer to session
// @route   POST /api/interview/session/:id/qa
// @access  Private
const addQuestionAnswer = async (req, res) => {
  try {
    const { question, answer } = req.body;
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Check if session belongs to user
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this session'
      });
    }

    session.questions.push({ question, answer });

/* ===== INTERVIEW ENGINE LOGIC ===== */
const engine = new InterviewEngine();

// Restore engine state from session (important for state continuity)
engine.state = session.currentState;
engine.tranistion.followups = session.stateCounters?.followups || 0;
engine.tranistion.deepdives = session.stateCounters?.deepdives || 0;

// temporary scoring logic (later AI will send score)
let score = 5; 
let signal = "AVERAGE";

if (score >= 8) signal = "GOOD";
if (score <= 4) signal = "BAD";

// get next interview state based on current state and answer quality
const nextState = engine.process(signal);

// save state and counters back to DB
session.currentState = nextState;
session.stateCounters = {
  followups: engine.tranistion.followups,
  deepdives: engine.tranistion.deepdives
};

await session.save();

res.json({
  success: true,
  nextState: nextState,
  data: session
});

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get next AI-generated question
// @route   GET /api/interview/session/:id/next-question
// @access  Private
const getNextQuestion = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Check if session belongs to user
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this session'
      });
    }

    // Get resume data if available
    let resumeData = null;
    if (session.resumeId) {
      try {
        const resume = await Resume.findById(session.resumeId);
        if (resume && resume.isParsed) {
          resumeData = resume.parsedData;
        }
      } catch (err) {
        console.error('Error fetching resume:', err.message);
      }
    }

    // Get conversation history (last 3 Q&A pairs)
    const conversationHistory = session.questions.slice(-3).map(qa => ({
      question: qa.question,
      answer: qa.answer
    }));

    // Call AI service to generate question
    const aiResponse = await aiService.generateQuestion({
      state: session.currentState,
      resumeData: resumeData,
      jobDescription: session.jobDescription,
      conversationHistory: conversationHistory
    });

    res.json({
      success: true,
      data: aiResponse.data,
      currentState: session.currentState
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete interview session
// @route   DELETE /api/interview/session/:id
// @access  Private
const deleteSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Check if session belongs to user
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this session'
      });
    }

    await session.deleteOne();

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload interview video
// @route   POST /api/interview/session/:id/upload-video
// @access  Private
const uploadVideo = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    const session = await InterviewSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found'
      });
    }

    // Verify user owns this session
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload video for this session'
      });
    }

    // Save video path to session
    session.videoPath = file.path;
    await session.save();

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        videoPath: file.path,
        size: file.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  startSession,
  completeSession,
  addQuestionAnswer,
  getNextQuestion,
  deleteSession,
  uploadVideo
};
