const axios = require('axios');
const config = require('../config/config');

/**
 * Service for handling AI-powered content generation
 */
class AIService {
  /**
   * Generate social media post content using OpenAI
   * 
   * @param {Object} options - Content generation options
   * @param {string} options.topic - The topic for the post
   * @param {string} options.platform - The platform (instagram, facebook, etc.)
   * @param {string} options.contentType - The type of content (post, carousel, story, etc.)
   * @param {string} options.tone - The desired tone of the content
   * @param {Object} options.businessProfile - Information about the business
   * @param {string} options.templateType - The selected template type
   * @returns {Promise<Object>} Generated content including title, content, and hashtags
   */
  async generatePostContent(options) {
    try {
      console.log('Generating AI content with options:', JSON.stringify(options, null, 2));
      
      // Ensure we have an API key
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('Missing OpenAI API Key');
        throw new Error('OpenAI API key is required for content generation');
      }
      
      // Extract options
      const { topic, platform, contentType, tone, businessProfile, templateType } = options;
      
      // Create the prompt for OpenAI
      const prompt = this.createPostPrompt({
        topic,
        platform,
        contentType,
        tone,
        businessProfile,
        templateType
      });
      
      console.log('Sending prompt to OpenAI:', prompt);
      
      // Call OpenAI API
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: 'You are a professional social media content creator that specializes in creating engaging, on-brand content for businesses.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract and parse the response
      const aiResponse = response.data.choices[0].message.content;
      console.log('Received AI response:', aiResponse);
      
      // Parse the AI response to extract structured content
      const parsedContent = this.parseAIResponse(aiResponse);
      
      return parsedContent;
    } catch (error) {
      console.error('Error in AI content generation:', error);
      
      // Check for OpenAI API specific errors
      if (error.response && error.response.data) {
        console.error('OpenAI API error details:', error.response.data);
        
        // Handle different error types
        if (error.response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your API key and try again.');
        } else if (error.response.status === 429) {
          throw new Error('OpenAI API rate limit exceeded. Please try again later.');
        }
      }
      
      throw new Error('Failed to generate content: ' + (error.message || 'Unknown error'));
    }
  }
  
  /**
   * Create a prompt for the OpenAI API based on the requested content
   */
  createPostPrompt(options) {
    const { topic, platform, contentType, tone, businessProfile, templateType } = options;
    
    // Construct information about the business
    const businessInfo = businessProfile 
      ? `Business name: ${businessProfile.name}
         Industry: ${businessProfile.industry || 'Not specified'}
         Target audience: ${businessProfile.targetAudience || 'Not specified'}
         Products/Services: ${(businessProfile.products || []).join(', ')}
         Business description: ${businessProfile.description || 'Not specified'}`
      : 'No business profile available';
    
    // Different instructions based on content type
    const contentTypeInstructions = {
      post: 'Create a regular social media post with engaging text.',
      carousel: 'Create content for a carousel post with multiple slides. Include an intro and descriptions for 3-5 slides.',
      story: 'Create brief, attention-grabbing content for a story that disappears after 24 hours.',
      reel: 'Create content for a short-form video post that is entertaining and engaging.'
    };
    
    // Platform-specific guidance
    const platformGuidance = {
      instagram: 'Instagram content should be visual and use 5-10 relevant hashtags.',
      facebook: 'Facebook content should be conversational and encourage engagement.',
      twitter: 'Twitter content should be concise (under 280 characters) and timely.',
      linkedin: 'LinkedIn content should be professional and industry-relevant.',
      tiktok: 'TikTok content should be trendy, authentic, and entertaining.'
    };
    
    // Template type guidance
    const templateGuidance = {
      product: 'Focus on highlighting product features, benefits, and use cases.',
      testimonial: 'Format this as a customer testimonial or success story.',
      tip: 'Share practical advice, tips, or industry insights.',
      promotion: 'Create promotional content highlighting special offers or deals.',
      event: 'Announce or promote an upcoming event, webinar, or launch.',
      news: 'Share company news, updates, or announcements.'
    };
    
    // Construct the prompt
    return `
      Create engaging social media content for the following specifications:
      
      TOPIC: ${topic}
      PLATFORM: ${platform}
      CONTENT TYPE: ${contentType} - ${contentTypeInstructions[contentType] || 'Create engaging social media content.'}
      TONE: ${tone || 'Professional'}
      TEMPLATE TYPE: ${templateType || 'standard'} - ${templateGuidance[templateType] || ''}
      
      BUSINESS INFORMATION:
      ${businessInfo}
      
      PLATFORM GUIDANCE:
      ${platformGuidance[platform] || 'Create platform-appropriate content.'}
      
      Please format your response like this:
      
      TITLE: [A catchy title for the post]
      
      CONTENT: [The main content of the post]
      
      HASHTAGS: [A list of 5-8 relevant hashtags separated by commas]
      
      Make the content authentic, engaging, and aligned with the brand. Avoid generic, template-like content.
    `;
  }
  
  /**
   * Parse the OpenAI response to extract structured content
   */
  parseAIResponse(aiResponse) {
    try {
      // Extract title
      const titleMatch = aiResponse.match(/TITLE:(.*?)(?=\n\n|CONTENT:)/s);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Extract content
      const contentMatch = aiResponse.match(/CONTENT:(.*?)(?=\n\n|HASHTAGS:)/s);
      const content = contentMatch ? contentMatch[1].trim() : '';
      
      // Extract hashtags
      const hashtagsMatch = aiResponse.match(/HASHTAGS:(.*?)$/s);
      let hashtags = [];
      
      if (hashtagsMatch && hashtagsMatch[1]) {
        // Process hashtags - handle various formats
        const hashtagsText = hashtagsMatch[1].trim();
        
        if (hashtagsText.includes(',')) {
          // Comma-separated list
          hashtags = hashtagsText.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag)
            .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
        } else if (hashtagsText.includes(' ')) {
          // Space-separated list
          hashtags = hashtagsText.split(' ')
            .map(tag => tag.trim())
            .filter(tag => tag)
            .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
        } else {
          // Single hashtag
          hashtags = [hashtagsText.startsWith('#') ? hashtagsText : `#${hashtagsText}`];
        }
      }
      
      return {
        title,
        content, 
        hashtags
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Return a basic structure if parsing fails
      return {
        title: 'Generated Post',
        content: aiResponse,
        hashtags: []
      };
    }
  }
  
  /**
   * Generate a business profile bio using OpenAI
   * 
   * @param {Object} options - Content generation options
   * @param {string} options.businessName - The name of the business
   * @param {string} options.industry - The industry of the business
   * @param {string} options.products - Products or services offered
   * @param {string} options.tone - The desired tone of the bio
   * @returns {Promise<string>} Generated bio content
   */
  async generateProfileBio(options) {
    try {
      const { businessName, industry, products, tone } = options;
      
      // Ensure we have an API key
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('Missing OpenAI API Key');
        throw new Error('OpenAI API key is required for bio generation');
      }
      
      // Create the prompt
      const prompt = `
        Create a compelling business profile bio for social media with the following details:
        
        Business Name: ${businessName}
        Industry: ${industry}
        Products/Services: ${products}
        Tone: ${tone || 'Professional'}
        
        The bio should be concise (150-200 characters), engaging, and highlight the unique value proposition.
        Don't use hashtags or emojis unless specifically relevant to the brand.
      `;
      
      // Call OpenAI API
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a professional brand strategist that specializes in creating compelling business bios.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Return the generated bio
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating business bio:', error);
      throw new Error('Failed to generate business bio: ' + (error.message || 'Unknown error'));
    }
  }
}

module.exports = new AIService(); 