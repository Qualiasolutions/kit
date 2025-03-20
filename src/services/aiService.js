const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Log OpenAI configuration for debugging
console.log('OpenAI API configuration:', {
  keyProvided: !!process.env.OPENAI_API_KEY,
  keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
});

/**
 * Generate content for social media posts using OpenAI
 * @param {Object} params - Parameters for content generation
 * @param {string} params.topic - Topic of the post
 * @param {string} params.platform - Social media platform
 * @param {string} params.contentType - Type of content (post, story, reel, etc.)
 * @param {string} params.tone - Tone of the content
 * @param {boolean} params.includeHashtags - Whether to include hashtags
 * @returns {Promise<Object>} - Generated content
 */
async function generatePostContent(params) {
  try {
    const { topic, platform, contentType, tone, includeHashtags } = params;
    
    // Create prompt
    const prompt = `Create a ${tone} ${contentType} for ${platform} about "${topic}". 
    The content should be engaging and optimized for ${platform}.
    ${includeHashtags ? 'Include 5-7 relevant hashtags at the end.' : ''}
    Format the response as a JSON with title and content fields.`;
    
    console.log('Generating post content with parameters:', {
      topic, platform, contentType, tone,
      apiKeyAvailable: !!process.env.OPENAI_API_KEY
    });
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a social media content expert specializing in creating engaging ${platform} content. 
          Your content is known for being ${tone} and highly engaging for the platform's audience.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const result = JSON.parse(response.choices[0].message.content);
    console.log('Generated content successfully');
    
    // Extract hashtags if they exist in the content
    let content = result.content;
    let hashtags = [];
    
    if (includeHashtags && content.includes('#')) {
      // Extract hashtags using regex
      const hashtagRegex = /#(\w+)/g;
      let match;
      let hashtagText = '';
      
      // Find the section with hashtags
      const hashtagIndex = content.indexOf('#');
      if (hashtagIndex !== -1) {
        hashtagText = content.substring(hashtagIndex);
        content = content.substring(0, hashtagIndex).trim();
      }
      
      // Extract all hashtags
      while ((match = hashtagRegex.exec(hashtagText)) !== null) {
        hashtags.push('#' + match[1]);
      }
    }
    
    return {
      title: result.title || generateTitle(topic, platform),
      content: content,
      hashtags: hashtags,
      generatedBy: 'ai'
    };
  } catch (error) {
    console.error('Error generating post content:', error.message);
    if (error.response) {
      console.error('OpenAI API error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw new Error('Failed to generate content. Please try again.');
  }
}

/**
 * Generate hashtags for a post using OpenAI
 * @param {string} content - Post content to generate hashtags for
 * @param {number} count - Number of hashtags to generate
 * @returns {Promise<Array>} - Array of hashtags
 */
async function generateHashtags(content, count = 7) {
  try {
    // Create prompt
    const prompt = `Generate ${count} highly relevant and trending hashtags for the following content. 
    Return ONLY the hashtags as a JSON array of strings with the hashtag symbol (#).
    Content: "${content}"`;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a social media hashtag expert who knows the most effective hashtags for maximizing engagement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Make sure we have an array of hashtags
    let hashtags = Array.isArray(result.hashtags) ? result.hashtags : 
                   Array.isArray(result) ? result : 
                   Object.values(result)[0];
    
    // Ensure all hashtags start with #
    hashtags = hashtags.map(tag => tag.startsWith('#') ? tag : '#' + tag);
    
    return hashtags.slice(0, count);
  } catch (error) {
    console.error('Error generating hashtags:', error);
    throw new Error('Failed to generate hashtags. Please try again.');
  }
}

/**
 * Generate profile bio for a social media platform
 * @param {Object} params - Parameters for bio generation
 * @param {string} params.platform - Social media platform
 * @param {string} params.businessType - Type of business
 * @returns {Promise<string>} - Generated bio
 */
async function generateProfileBio(params) {
  try {
    const { platform, businessType } = params;
    
    // Create prompt
    const prompt = `Create a compelling ${platform} bio for a ${businessType} business. 
    The bio should be optimized for ${platform} and include appropriate emoji if relevant.
    Keep it within the character limits of ${platform}.
    Return only the bio text.`;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a social media profile optimization expert who creates engaging bios for ${platform}.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating profile bio:', error);
    throw new Error('Failed to generate profile bio. Please try again.');
  }
}

/**
 * Generate a content calendar plan for social media
 * @param {Object} params - Parameters for calendar generation
 * @param {string} params.month - Target month
 * @param {number} params.year - Target year
 * @param {number} params.postsPerWeek - Number of posts per week
 * @param {Array} params.platforms - Social media platforms to include
 * @returns {Promise<Object>} - Generated content calendar
 */
async function generateContentCalendar(params) {
  try {
    const { month, year, postsPerWeek, platforms } = params;
    
    // Create prompt
    const prompt = `Create a content calendar for ${month} ${year} with ${postsPerWeek} posts per week for ${platforms.join(', ')}.
    For each post, include the date, platform, content type, topic, and a brief description.
    Return the response as a JSON object with an array of posts.`;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a social media content strategist who creates effective content calendars for businesses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      month,
      year,
      posts: result.posts || result.calendar || result.contentCalendar || []
    };
  } catch (error) {
    console.error('Error generating content calendar:', error);
    throw new Error('Failed to generate content calendar. Please try again.');
  }
}

/**
 * Helper function to generate a title if none exists
 * @param {string} topic - Topic of the post
 * @param {string} platform - Social media platform
 * @returns {string} - Generated title
 */
function generateTitle(topic, platform) {
  return `${platform} Post about ${topic}`;
}

/**
 * Generate fallback content if AI generation fails
 * @param {Object} params - Generation parameters
 * @returns {Object} - Fallback content
 */
function generateFallbackContent(params) {
  const { topic, platform, contentType, tone } = params;
  
  return {
    title: `${platform} ${contentType} about ${topic}`,
    content: `This is a ${tone} post about ${topic} for ${platform}. The AI-generated content could not be created at this time.`,
    hashtags: [`#${topic.replace(/\s+/g, '')}`, `#${platform}`],
    generatedBy: 'fallback'
  };
}

module.exports = {
  generatePostContent,
  generateHashtags,
  generateProfileBio,
  generateContentCalendar,
  generateFallbackContent
}; 