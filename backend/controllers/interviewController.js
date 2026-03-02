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

// Get resume data for AI evaluation
let resumeData = null;
if (session.resumeId) {
  try {
    const resume = await Resume.findById(session.resumeId);
    if (resume && resume.parsedData) {
      resumeData = resume.parsedData;
    }
  } catch (err) {
    console.error('Failed to fetch resume for evaluation:', err.message);
  }
}

// AI-powered answer evaluation
const aiResponse = await aiService.evaluateAnswer({
  question,
  answer,
  state: session.currentState,
  resumeData
});

const evalData = aiResponse.evaluation;


// Log evaluation results for debugging
console.log('\n🤖 AI Answer Evaluation:');
console.log(`   Score: ${score}/10`);
console.log(`   Signal: ${signal}`);
console.log(`   Feedback: ${feedback}`);
console.log(`   Current State: ${session.currentState}`);

// get next interview state based on current state and answer quality
const nextState = engine.process(signal);

console.log(`   Next State: ${nextState}`);
console.log('─────────────────────────────────────\n');

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
  evaluation: { score, signal, feedback }, // Include AI evaluation for debugging
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

// @desc    Mock analyze interview video (returns dummy confidence scores)
// @route   POST /api/interview/session/:id/analyze
// @access  Private
const analyzeInterview = async (req, res) => {
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
        message: 'Not authorized to analyze this session'
      });
    }

    // Mock AI analysis - generating random scores between 60-95
    const mockAnalysis = {
      facialConfidence: Math.floor(Math.random() * 35) + 60,  // 60-95
      voiceClarity: Math.floor(Math.random() * 35) + 60,
      eyeContact: Math.floor(Math.random() * 35) + 60,
      speechPace: Math.floor(Math.random() * 35) + 60,
      overallConfidence: 0,  // Will calculate as average
      feedback: '',
      analyzedAt: new Date()
    };

    console.log('Generated mock analysis:', mockAnalysis);

    // Calculate overall confidence as average
    mockAnalysis.overallConfidence = Math.floor(
      (mockAnalysis.facialConfidence + mockAnalysis.voiceClarity + 
       mockAnalysis.eyeContact + mockAnalysis.speechPace) / 4
    );
    
    console.log('Final analysis with overall score:', mockAnalysis);

    // Generate feedback based on overall score
    if (mockAnalysis.overallConfidence >= 85) {
      mockAnalysis.feedback = 'Excellent performance! You showed strong confidence and communication skills throughout the interview.';
    } else if (mockAnalysis.overallConfidence >= 75) {
      mockAnalysis.feedback = 'Good job! Your confidence and clarity were above average. Keep practicing to improve further.';
    } else if (mockAnalysis.overallConfidence >= 65) {
      mockAnalysis.feedback = 'Decent performance. Consider working on maintaining eye contact and speaking with more clarity.';
    } else {
      mockAnalysis.feedback = 'There is room for improvement. Practice more to build confidence and improve your communication skills.';
    }

    console.log('Analysis with feedback:', mockAnalysis);

    // Save analysis to session
    session.analysis = mockAnalysis;
    await session.save();

    res.json({
      success: true,
      message: 'Interview analysis completed',
      data: mockAnalysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add video question and answer to session (with transcription)
// @route   POST /api/interview/session/:id/qa-video
// @access  Private
const addVideoQuestionAnswer = async (req, res) => {
  try {
    const { question } = req.body;
    const files = req.files;

    if (!files || !files.video || !files.audio) {
      return res.status(400).json({
        success: false,
        message: 'Both video and audio files are required'
      });
    }

    const videoFile = files.video[0];
    const audioFile = files.audio[0];

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

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

    // Step 1: Transcribe the AUDIO using Whisper (not video - no FFmpeg needed!)
    console.log('Processing video answer...');
    console.log(`   Video file: ${videoFile.filename} (${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`   Audio file: ${audioFile.filename} (${(audioFile.size / 1024).toFixed(2)} KB) - WAV format`);
    
    const transcriptionResult = await aiService.transcribeVideo(audioFile.path);
    const answer = transcriptionResult.transcript;
    console.log(`Transcription: "${answer.substring(0, 100)}..."`);

    // Step 2: Interview engine logic (same as text-based)
    const engine = new InterviewEngine();

    // Restore engine state from session
    engine.state = session.currentState;
    engine.tranistion.followups = session.stateCounters?.followups || 0;
    engine.tranistion.deepdives = session.stateCounters?.deepdives || 0;

    // Get resume data for AI evaluation
    let resumeData = null;
    if (session.resumeId) {
      try {
        const resume = await Resume.findById(session.resumeId);
        if (resume && resume.parsedData) {
          resumeData = resume.parsedData;
        }
      } catch (err) {
        console.error('Failed to fetch resume for evaluation:', err.message);
      }
    }

    // Step 3: AI-powered answer evaluation
    console.log('📤 Calling AI evaluation service...');
    const evaluation = await aiService.evaluateAnswer({
      question,
      answer,
      state: session.currentState,
      resumeData
    });
    const evalData = evaluation.evaluation;
    const score = evaluation.final_score;
    const signal = evaluation.signal;
    const feedback = evaluation.feedback;

    // Log evaluation results
    console.log('\n🤖 AI Answer Evaluation:');
    console.log(`   Score: ${evalData.final_score}/10`);
    console.log(`   Signal: ${evalData.signal}`);
    console.log(`   Feedback: ${evalData.feedback}`);

    // Step 4: Get next state
    const nextState = engine.process(signal);

    console.log(`   Next State: ${nextState}`);
    console.log('─────────────────────────────────────\n');

    // Step 5: Save everything to session
    session.questions.push({
      question,
      answer,
      transcript: answer,
      evaluation: {
        technical_accuracy: evalData.technical_accuracy,
        depth: evalData.depth,
        clarity: evalData.clarity,
        relevance: evalData.relevance,
        final_score: evalData.final_score,
        signal: evalData.signal,
        feedback: evalData.feedback
      },
      videoPath: videoFile.path,
      timestamp: new Date()
    });
    session.currentState = nextState;
    session.stateCounters = {
      followups: engine.tranistion.followups,
      deepdives: engine.tranistion.deepdives
    };

    await session.save();

    res.json({
      success: true,
      nextState: nextState,
      transcript: answer,
      evaluation: {
        technical_accuracy: evaluation.technical_accuracy,
        depth: evaluation.depth,
        clarity: evaluation.clarity,
        relevance: evaluation.relevance,
        final_score: evaluation.final_score,
        signal: evaluation.signal,
        feedback: evaluation.feedback
      },
      videoPath: videoFile.path,
      language: transcriptionResult.language,
      data: session
    });

  } catch (error) {
    console.error('❌ Video Q&A error:', error);
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
  addVideoQuestionAnswer,
  getNextQuestion,
  deleteSession,
  uploadVideo,
  analyzeInterview
};