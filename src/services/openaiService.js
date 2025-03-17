const axios = require('axios');
const ErrorResponse = require('../utils/errorResponse');

/**
 * OpenAI API service for content generation
 * @param {string} apiKey - User's OpenAI API key
 */
class OpenAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.openai.com/v1';
  }

  /**
   * Generate content based on business profile
   * @param {Object} profile - Business profile data
   * @param {string} templateType - Selected template type
   * @returns {Promise<Object>} Generated content
   */
  async generateContent(profile, templateType) {
    if (!this.apiKey) {
      throw new ErrorResponse('OpenAI API key is required', 400);
    }

    try {
      const prompt = this._buildPrompt(profile, templateType);
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a professional content creator and marketer who helps businesses create engaging social media content." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new ErrorResponse('Failed to generate content', 500);
      }

      const content = response.data.choices[0].message.content;
      return this._parseGeneratedContent(content);
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new ErrorResponse('Invalid OpenAI API key', 401);
      }
      
      throw new ErrorResponse(
        error.response?.data?.error?.message || 'Failed to generate content',
        error.response?.status || 500
      );
    }
  }

  /**
   * Build prompt for content generation
   * @private
   * @param {Object} profile - Business profile data
   * @param {string} templateType - Selected template type
   * @returns {string} Generated prompt
   */
  _buildPrompt(profile, templateType) {
    return `
Create engaging social media content for a business with the following profile:

Business Name: ${profile.name}
Industry: ${profile.industry}
Tone: ${profile.tone || 'Professional'}
Target Audience: ${profile.targetAudience || 'General'}
Key Values: ${profile.keyValues || 'Quality, Service, Innovation'}
Key Products/Services: ${profile.keyProducts || 'Various services'}
Brief Description: ${profile.description || 'A business serving customers with quality products and services'}

Create content for a ${templateType} template.

Please provide the following in JSON format:
{
  "headline": "Attention-grabbing headline",
  "mainText": "Main post content that showcases the business value (2-3 sentences)",
  "callToAction": "Clear call to action",
  "tags": ["3-5 relevant hashtags"],
  "imagePrompt": "A detailed description for generating an image that would work well with this post"
}

The content should reflect the business's brand voice, appeal to their target audience, and highlight their unique value proposition.
    `;
  }

  /**
   * Parse generated content from OpenAI
   * @private
   * @param {string} content - Raw generated content
   * @returns {Object} Parsed content object
   */
  _parseGeneratedContent(content) {
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in the generated content');
      }
      
      const jsonContent = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const requiredFields = ['headline', 'mainText', 'callToAction', 'tags', 'imagePrompt'];
      for (const field of requiredFields) {
        if (!jsonContent[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      return jsonContent;
    } catch (error) {
      console.error('Error parsing generated content:', error);
      throw new ErrorResponse('Failed to parse generated content', 500);
    }
  }
}

module.exports = OpenAIService; 