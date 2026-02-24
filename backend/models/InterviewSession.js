import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  resumeId: {
    type: String,
    default: null
  },
  jobDescription: {
    type: String,
    default: null
  },
  currentState: {
    type: String,
    enum: ['introduction', 'resume-based', 'follow-up', 'deep-dive', 'closing', 'end'],
    default: 'introduction'
  },
  stateCounters: {
    followups: { type: Number, default: 0 },
    deepdives: { type: Number, default: 0 }
  },
  questions: [{
    question: String,
    answer: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  evaluation: {
    overallScore: {
      type: Number,
      default: 0
    },
    confidenceLevel: {
      type: Number,
      default: 0
    },
    dsaLevel: {
      type: Number,
      default: 0
    },
    feedback: {
      type: String,
      default: ''
    }
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('InterviewSession', interviewSessionSchema);
