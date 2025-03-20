const aiService = require('../services/aiService');

/**
 * Controller for AI-generated post content
 */
class AIPostController {
  /**
   * Generate content for a social media post
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generatePost(req, res) {
    try {
      const { 
        topic, 
        platform, 
        contentType, 
        tone, 
        businessProfile, 
        templateType 
      } = req.body;
      
      // Validate required fields
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }
      
      if (!platform) {
        return res.status(400).json({ error: 'Platform is required' });
      }
      
      if (!contentType) {
        return res.status(400).json({ error: 'Content type is required' });
      }
      
      // Log the request for debugging
      console.log('Received AI content generation request:', {
        topic,
        platform,
        contentType,
        tone,
        templateType,
        userId: req.user ? req.user.id : 'guest'
      });
      
      // Check for OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        console.error('Missing OpenAI API key');
        return res.status(500).json({ 
          error: 'OpenAI API key is not configured',
          message: 'The server is missing the OpenAI API key. Please contact the administrator.'
        });
      }
      
      // Generate content
      const generatedContent = await aiService.generatePostContent({
        topic,
        platform,
        contentType,
        tone,
        businessProfile,
        templateType
      });
      
      // Return the generated content
      return res.status(200).json(generatedContent);
    } catch (error) {
      console.error('Error in AI post generation:', error);
      
      // Send a user-friendly error message
      return res.status(500).json({ 
        error: 'Failed to generate content',
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
  
  /**
   * Generate a business profile bio
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateBio(req, res) {
    try {
      const { businessName, industry, products, tone } = req.body;
      
      // Validate required fields
      if (!businessName) {
        return res.status(400).json({ error: 'Business name is required' });
      }
      
      if (!industry) {
        return res.status(400).json({ error: 'Industry is required' });
      }
      
      // Generate bio
      const bio = await aiService.generateProfileBio({
        businessName,
        industry,
        products,
        tone
      });
      
      // Return the generated bio
      return res.status(200).json({ bio });
    } catch (error) {
      console.error('Error in bio generation:', error);
      
      // Send a user-friendly error message
      return res.status(500).json({ 
        error: 'Failed to generate bio',
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
}

module.exports = new AIPostController();

/**
 * Generate hashtags for a social media post
 */
exports.generateHashtags = async (req, res) => {
  try {
    const { content, count } = req.body;
    
    // Validate required fields
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: content is required'
      });
    }
    
    // Generate hashtags using AI service
    const hashtags = await aiService.generateHashtags(content, count || 7);
    
    // Return generated hashtags
    return res.status(200).json({
      success: true,
      data: hashtags
    });
  } catch (error) {
    console.error('Error in generateHashtags controller:', error);
    
    // Return generic hashtags if AI generation fails
    const fallbackHashtags = ['#socialmedia', '#marketing', '#digital', '#business', '#growth', '#success', '#trending'];
    
    return res.status(200).json({
      success: true,
      data: fallbackHashtags,
      warning: 'Used fallback hashtags due to an error'
    });
  }
};

/**
 * Generate a content calendar for social media
 */
exports.generateContentCalendar = async (req, res) => {
  try {
    const { month, year, postsPerWeek, platforms } = req.body;
    
    // Set defaults for missing values
    const currentDate = new Date();
    const calendarMonth = month || currentDate.toLocaleString('default', { month: 'long' });
    const calendarYear = year || currentDate.getFullYear();
    
    // Validate required fields
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: platforms (array) is required'
      });
    }
    
    // Generate calendar using AI service
    const calendar = await aiService.generateContentCalendar({
      month: calendarMonth,
      year: calendarYear,
      postsPerWeek: postsPerWeek || 3,
      platforms
    });
    
    // Return generated calendar
    return res.status(200).json({
      success: true,
      data: calendar
    });
  } catch (error) {
    console.error('Error in generateContentCalendar controller:', error);
    
    // Return a basic calendar if AI generation fails
    const fallbackCalendar = generateFallbackCalendar(req.body);
    
    return res.status(200).json({
      success: true,
      data: fallbackCalendar,
      warning: 'Used fallback calendar due to an error'
    });
  }
};

/**
 * Generate a fallback content calendar
 * @private
 */
function generateFallbackCalendar(options) {
  const { month, year, postsPerWeek, platforms } = options;
  
  // Set defaults
  const currentDate = new Date();
  const calendarMonth = month || currentDate.toLocaleString('default', { month: 'long' });
  const calendarYear = year || currentDate.getFullYear();
  const posts = [];
  
  // Basic content topics
  const topics = [
    'Company update',
    'Product showcase',
    'Customer testimonial',
    'Industry news',
    'Tips and tricks',
    'Behind the scenes',
    'Special offer',
    'Team spotlight',
    'FAQ',
    'How-to guide'
  ];
  
  // Create a few sample posts
  for (let i = 0; i < (postsPerWeek || 3); i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    posts.push({
      date: `${calendarYear}-${currentDate.getMonth() + 1}-${i * 7 + 1}`,
      platform,
      contentType: 'post',
      topic,
      description: `Create a post about ${topic} for your audience on ${platform}`
    });
  }
  
  return {
    month: calendarMonth,
    year: calendarYear,
    posts
  };
}
