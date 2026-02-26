import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalName: String,
  fileName: String,
  filePath: String,
  fileType: String,
  fileSize: Number,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  // AI-parsed data
  parsedData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  isParsed: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('Resume', resumeSchema);
