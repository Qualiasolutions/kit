const OpenAI = require('openai');
const axios = require('axios');
const config = require('../config/config');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
    const { topic, platform, contentType, tone, businessProfile, templateType } = options;
    
    try {
      let businessContext = "a business";
      let audienceContext = "general audience";
      let platformSpecifics = "";
      let contentStructure = "";
      let businessVoice = "";
      
      // Process business profile information if available
      if (businessProfile) {
        // Business details
        businessContext = `${businessProfile.businessName}, a business in the ${businessProfile.industry} industry`;
        if (businessProfile.niche) {
          businessContext += `, specializing in ${businessProfile.niche}`;
        }
        
        // Target audience
        if (businessProfile.targetAudience && businessProfile.targetAudience.length > 0) {
          audienceContext = businessProfile.targetAudience.join(', ');
        }
        
        // Business voice/tone preferences
        if (businessProfile.businessVoice && businessProfile.businessVoice.length > 0) {
          businessVoice = `The brand voice is ${businessProfile.businessVoice.join(' and ')}.`;
        }
      }
      
      // Platform-specific guidance
      switch (platform.toLowerCase()) {
        case 'instagram':
          platformSpecifics = "For Instagram, use emojis appropriately and focus on visually-driven content. Keep it concise but engaging.";
          break;
        case 'facebook':
          platformSpecifics = "For Facebook, balance informative and conversational tone. Questions drive engagement.";
          break;
        case 'twitter':
          platformSpecifics = "For Twitter, be concise and direct. Use relevant hashtags but don't overdo it.";
          break;
        case 'linkedin':
          platformSpecifics = "For LinkedIn, maintain a professional tone while sharing industry insights and value.";
          break;
        case 'tiktok':
          platformSpecifics = "For TikTok, be casual, trendy, and authentic. Use appropriate trends and sounds references.";
          break;
      }
      
      // Content type specifics
      switch (contentType.toLowerCase()) {
        case 'post':
          contentStructure = "Create a standard post with a hook, body, and call-to-action.";
          break;
        case 'carousel':
          contentStructure = "Create content for a multi-slide carousel post with a logical flow between points.";
          break;
        case 'story':
          contentStructure = "Create brief, punchy content suitable for a disappearing story format.";
          break;
        case 'reel':
          contentStructure = "Create a script for a short video that grabs attention quickly.";
          break;
      }
      
      // Build the prompt
      const prompt = `
        Create engaging social media content for ${businessContext} targeting ${audienceContext}.
        
        Topic: ${topic}
        Platform: ${platform}
        Content Type: ${contentType}
        Tone: ${tone}
        ${businessVoice ? businessVoice : ''}
        
        ${platformSpecifics}
        ${contentStructure}
        
        If the template type is ${templateType || 'general'}, consider this in the content style.
        
        Generate:
        1. A catchy title/headline
        2. The main post content
        3. 5-7 relevant hashtags
      `;
      
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional social media marketer who creates engaging, platform-specific content."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        max_tokens: 1000
      });
      
      // Process the AI response
      const aiResponse = completion.choices[0].message.content;
      
      // Parse the AI response
      const titleMatch = aiResponse.match(/(?:Title:|Headline:)(.*?)(?:\n|$)/i);
      const contentMatch = aiResponse.match(/(?:Content:|Post:|Main Content:)([\s\S]*?)(?:\n*Hashtags|\n*$)/i);
      const hashtagsMatch = aiResponse.match(/(?:Hashtags:)([\s\S]*?)$/i);
      
      // Extract the components
      const title = titleMatch ? titleMatch[1].trim() : "";
      let content = contentMatch ? contentMatch[1].trim() : aiResponse.trim();
      let hashtags = [];
      
      if (hashtagsMatch) {
        const hashtagText = hashtagsMatch[1].trim();
        hashtags = hashtagText
          .split(/[\s,]+/)
          .map(tag => tag.trim())
          .filter(tag => tag.startsWith('#') || (tag = '#' + tag))
          .slice(0, 7); // Limit to 7 hashtags
      }
      
      return {
        success: true,
        content: {
          title,
          content,
          hashtags
        }
      };
    } catch (error) {
      console.error('Error generating content with OpenAI:', error);
      
      return {
        success: false,
        error: 'Failed to generate content',
        message: error.message
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