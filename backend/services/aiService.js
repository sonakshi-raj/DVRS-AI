import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Simple AI Service Client - Just resume parsing for now
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
