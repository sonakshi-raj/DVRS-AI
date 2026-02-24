import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InterviewSession from './models/InterviewSession.js';

dotenv.config();

const monitorInterview = async (sessionId) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 Monitoring Interview Session...\n');
    console.log('Session ID:', sessionId);
    console.log('Press Ctrl+C to stop monitoring\n');
    console.log('─'.repeat(60));
    
    let lastQuestionCount = 0;
    let lastState = '';
    
    setInterval(async () => {
      const session = await InterviewSession.findById(sessionId).lean();
      
      if (!session) {
        console.log('⚠️  Session not found');
        return;
      }
      
      const currentQuestionCount = session.questions?.length || 0;
      const currentState = session.currentState;
      
      // Only log when something changes
      if (currentQuestionCount !== lastQuestionCount || currentState !== lastState) {
        console.log(`\n[${new Date().toLocaleTimeString()}] UPDATE:`);
        console.log(`  Status: ${session.status}`);
        console.log(`  Current State: ${currentState}`);
        console.log(`  Questions Answered: ${currentQuestionCount}`);
        
        if (currentQuestionCount > lastQuestionCount) {
          const latestQA = session.questions[currentQuestionCount - 1];
          console.log(`  Latest Q: ${latestQA.question.substring(0, 50)}...`);
          console.log(`  Latest A: ${latestQA.answer.substring(0, 50)}...`);
        }
        
        console.log('─'.repeat(60));
        
        lastQuestionCount = currentQuestionCount;
        lastState = currentState;
      }
      
      if (session.status === 'completed') {
        console.log('\n✅ Interview completed!');
        console.log(`Final state: ${session.currentState}`);
        console.log(`Total questions: ${currentQuestionCount}`);
        process.exit(0);
      }
    }, 1000); // Check every second
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

// Get session ID from command line argument
const sessionId = process.argv[2];

if (!sessionId) {
  console.log('Usage: node monitorInterview.js <sessionId>');
  console.log('\nTo get sessionId:');
  console.log('1. Start an interview in the frontend');
  console.log('2. Check the browser URL: /interview?sessionId=XXXXXX');
  console.log('3. Copy the sessionId and run: node monitorInterview.js XXXXXX');
  process.exit(1);
}

monitorInterview(sessionId);
