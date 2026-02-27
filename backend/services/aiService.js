import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * AI Service Client - Resume parsing and question generation
 */
class AIService {
  /**
   * Parse resume using AI
   * @param {string} filePath - Path to resume file
   * @returns {Promise<Object>} Parsed resume data
   */
  async parseResume(filePath) {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/parse-resume`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 60000, // 60 second timeout for LLM processing
          family: 4  // Force IPv4
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Resume parsing failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Generate interview question using AI
   * @param {Object} params - Question generation parameters
   * @param {string} params.state - Interview state
   * @param {Object} params.resumeData - Parsed resume data (optional)
   * @param {string} params.jobDescription - Job description (optional)
   * @param {Array} params.conversationHistory - Previous Q&A pairs (optional)
   * @returns {Promise<Object>} Generated question
   */
  async generateQuestion({ state, resumeData, jobDescription, conversationHistory }) {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/generate-question`,
        {
          state: state,
          resume_data: resumeData || null,
          job_description: jobDescription || null,
          conversation_history: conversationHistory || []
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000, // 30 second timeout
          family: 4  // Force IPv4
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Question generation failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Health check for AI service
   * @returns {Promise<boolean>} Service status
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('AI Service health check failed:', error.message);
      return false;
    }
  }
}

export default new AIService();
