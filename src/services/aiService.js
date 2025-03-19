const axios = require('axios');
const localStorageService = require('./localStorageService');

/**
 * Service for AI-powered content generation
 */
class AIService {
  constructor() {
    // Default API configuration
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.apiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    
    // Fallback to using a local API if OpenAI is not configured
    this.useLocalFallback = !this.apiKey;
    
    if (this.useLocalFallback) {
      console.log('⚠️ OpenAI API key not found, using local fallback for AI services');
    }
  }
  
  /**
   * Generate content using OpenAI API
   * @param {string} prompt - The prompt to send to OpenAI
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - The generated content
   */
  async generateContent(prompt, options = {}) {
    try {
      if (this.useLocalFallback) {
        return this._generateLocalContent(prompt, options);
      }
      
      const model = options.model || this.defaultModel;
      const temperature = options.temperature || 0.7;
      const maxTokens = options.maxTokens || 500;
      
      const response = await axios.post(
        this.apiUrl,
        {
          model,
          messages: [
            { role: "system", content: options.systemPrompt || "You are a helpful assistant." },
            { role: "user", content: prompt }
          ],
          temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating content with AI:', error);
      // Fallback to local generation if API fails
      return this._generateLocalContent(prompt, options);
    }
  }
  
  /**
   * Generate social media post
   * @param {Object} businessProfile - Business profile data
   * @param {Object} postOptions - Post options
   * @returns {Promise<Object>} - Generated post data
   */
  async generatePost(businessProfile, postOptions) {
    try {
      const { contentType, topic, tone, platform, includeHashtags } = postOptions;
      
      // Create a detailed prompt for the AI
      const prompt = `
        Create a ${contentType} for ${platform} about "${topic}" for a ${businessProfile.industry} business.
        
        Business details:
        - Name: ${businessProfile.businessName}
        - Industry: ${businessProfile.industry}
        - Niche: ${businessProfile.niche}
        - Voice: ${businessProfile.businessVoice || tone || 'professional'}
        - Target audience: ${Array.isArray(businessProfile.targetAudience) ? businessProfile.targetAudience.join(', ') : businessProfile.targetAudience || 'general audience'}
        - Location: ${businessProfile.location || 'global'}
        
        Requirements:
        - Create a compelling ${contentType} that resonates with the target audience
        - Use a ${tone || businessProfile.businessVoice || 'professional'} tone
        - Format the content appropriately for ${platform}
        ${includeHashtags ? '- Include 5-7 relevant hashtags' : ''}
        
        Provide the following JSON format:
        {
          "title": "Short attention-grabbing title",
          "content": "Main content",
          "hashtags": ["hashtag1", "hashtag2", "..."] 
        }
      `;
      
      const systemPrompt = `You are an expert social media content creator who specializes in creating engaging content for businesses. You create content that drives engagement and converts.`;
      
      const generatedText = await this.generateContent(prompt, { 
        systemPrompt,
        temperature: 0.7,
        maxTokens: 800
      });
      
      // Parse the JSON response
      try {
        // Find JSON in the response (in case it added other text)
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        const jsonStr = jsonMatch[0];
        const parsedResponse = JSON.parse(jsonStr);
        
        return {
          title: parsedResponse.title,
          content: parsedResponse.content,
          hashtags: parsedResponse.hashtags || [],
          platform,
          contentType,
          topic,
          tone: tone || businessProfile.businessVoice || 'professional',
          createdAt: new Date().toISOString()
        };
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Return a fallback if parsing fails
        return this._generateFallbackPost(businessProfile, postOptions);
      }
    } catch (error) {
      console.error('Error generating post:', error);
      return this._generateFallbackPost(businessProfile, postOptions);
    }
  }
  
  /**
   * Generate hashtags for a post
   * @param {string} postContent - The post content to generate hashtags for
   * @param {string} industry - The business industry
   * @param {number} count - Number of hashtags to generate
   * @returns {Promise<Array<string>>} - Array of hashtags
   */
  async generateHashtags(postContent, industry, count = 5) {
    try {
      const prompt = `
        Generate ${count} relevant hashtags for the following social media post.
        The business is in the ${industry} industry.
        
        Post content: "${postContent}"
        
        Provide ONLY the hashtags, formatted as a JSON array of strings like this:
        ["hashtag1", "hashtag2", "hashtag3"]
      `;
      
      const systemPrompt = `You are a social media hashtag expert. You know exactly which hashtags drive the most engagement for different industries.`;
      
      const generatedText = await this.generateContent(prompt, { 
        systemPrompt,
        temperature: 0.7,
        maxTokens: 250
      });
      
      // Parse the JSON response
      try {
        // Find JSON in the response
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in response');
        }
        
        const jsonStr = jsonMatch[0];
        const hashtags = JSON.parse(jsonStr);
        
        // Ensure all hashtags start with #
        return hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`);
      } catch (parseError) {
        console.error('Error parsing hashtags response:', parseError);
        return this._generateFallbackHashtags(industry, count);
      }
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return this._generateFallbackHashtags(industry, count);
    }
  }
  
  /**
   * Generate a content calendar for a month
   * @param {Object} businessProfile - Business profile data
   * @param {Object} options - Calendar options
   * @returns {Promise<Array<Object>>} - Array of post ideas
   */
  async generateContentCalendar(businessProfile, options) {
    try {
      const { month, year, postsPerWeek, platforms } = options;
      
      const prompt = `
        Create a social media content calendar for ${month} ${year} for a ${businessProfile.industry} business.
        
        Business details:
        - Name: ${businessProfile.businessName}
        - Industry: ${businessProfile.industry}
        - Niche: ${businessProfile.niche}
        - Target audience: ${Array.isArray(businessProfile.targetAudience) ? businessProfile.targetAudience.join(', ') : businessProfile.targetAudience || 'general audience'}
        
        Requirements:
        - Create ${postsPerWeek} posts per week
        - Include content for these platforms: ${platforms.join(', ')}
        - Mix of content types (informational, promotional, engaging, etc.)
        - Each post should have a topic, content type, and brief description
        
        Provide the result as a JSON array:
        [
          {
            "date": "YYYY-MM-DD",
            "platform": "platform name",
            "contentType": "post/story/reel/etc",
            "topic": "brief topic",
            "description": "brief description of what the post should be about"
          }
        ]
      `;
      
      const systemPrompt = `You are an expert social media manager who creates strategic content calendars for businesses to maximize engagement and growth.`;
      
      const generatedText = await this.generateContent(prompt, { 
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1500
      });
      
      // Parse the JSON response
      try {
        // Find JSON in the response
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in response');
        }
        
        const jsonStr = jsonMatch[0];
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Error parsing calendar response:', parseError);
        return this._generateFallbackCalendar(businessProfile, options);
      }
    } catch (error) {
      console.error('Error generating content calendar:', error);
      return this._generateFallbackCalendar(businessProfile, options);
    }
  }
  
  /**
   * Generate bio for social media profile
   * @param {Object} businessProfile - Business profile data
   * @param {string} platform - Social media platform
   * @returns {Promise<string>} - Generated bio
   */
  async generateBio(businessProfile, platform) {
    try {
      const prompt = `
        Create a compelling bio for ${platform} for a ${businessProfile.industry} business.
        
        Business details:
        - Name: ${businessProfile.businessName}
        - Industry: ${businessProfile.industry}
        - Niche: ${businessProfile.niche}
        - Voice: ${businessProfile.businessVoice || 'professional'}
        - Target audience: ${Array.isArray(businessProfile.targetAudience) ? businessProfile.targetAudience.join(', ') : businessProfile.targetAudience || 'general audience'}
        - Location: ${businessProfile.location || 'global'}
        ${businessProfile.website ? `- Website: ${businessProfile.website}` : ''}
        
        Requirements:
        - Create a bio that's optimized for ${platform} (respecting character limits)
        - Include a call to action
        - Make it compelling and engaging
        - Use emojis appropriately
        
        Provide ONLY the bio text, with no explanation or commentary.
      `;
      
      const systemPrompt = `You are an expert in creating optimized social media bios that convert and engage. You know exactly what works on each platform.`;
      
      const generatedText = await this.generateContent(prompt, { 
        systemPrompt,
        temperature: 0.7,
        maxTokens: 250
      });
      
      return generatedText.trim();
    } catch (error) {
      console.error('Error generating bio:', error);
      return this._generateFallbackBio(businessProfile, platform);
    }
  }
  
  /**
   * LOCAL FALLBACK METHODS
   * These methods are used when the AI API is not available
   */
  
  /**
   * Generate content locally without API
   * @private
   */
  async _generateLocalContent(prompt, options) {
    // Simple template-based response
    console.log('Using local content generation fallback');
    
    // Extract key information from the prompt to create a somewhat relevant response
    const businessMatch = prompt.match(/business(?::|\.|\s)?\s*([A-Za-z0-9\s&]+)/i);
    const businessName = businessMatch ? businessMatch[1].trim() : 'Your Business';
    
    const industryMatch = prompt.match(/industry(?::|\.|\s)?\s*([A-Za-z0-9\s&]+)/i);
    const industry = industryMatch ? industryMatch[1].trim() : 'general';
    
    const platformMatch = prompt.match(/platform(?::|\.|\s)?\s*([A-Za-z0-9\s&]+)/i);
    const platform = platformMatch ? platformMatch[1].trim() : 'social media';
    
    // Check if we need to generate JSON
    if (prompt.includes('JSON') || prompt.includes('json')) {
      if (prompt.includes('hashtags')) {
        return `["#${industry}", "#business", "#marketing", "#socialmedia", "#growth"]`;
      }
      
      if (prompt.includes('calendar')) {
        return `[
          {
            "date": "2023-06-01",
            "platform": "${platform}",
            "contentType": "post",
            "topic": "Introduction to our services",
            "description": "Introduce your main products or services"
          },
          {
            "date": "2023-06-03",
            "platform": "${platform}",
            "contentType": "story",
            "topic": "Behind the scenes",
            "description": "Show your team at work"
          },
          {
            "date": "2023-06-05",
            "platform": "${platform}",
            "contentType": "reel",
            "topic": "Product showcase",
            "description": "Highlight your best-selling product"
          }
        ]`;
      }
      
      return `{
        "title": "Grow Your Business With Us",
        "content": "Looking to take your ${industry} business to the next level? At ${businessName}, we're passionate about helping you succeed. Our team of experts will work with you to develop a custom strategy that drives results. Contact us today to learn more!",
        "hashtags": ["#${industry}", "#business", "#growth", "#success", "#marketing"]
      }`;
    }
    
    // For plain text
    return `Looking to take your ${industry} business to the next level? At ${businessName}, we're passionate about helping you succeed. Our team of experts will work with you to develop a custom strategy that drives results. Contact us today to learn more!`;
  }
  
  /**
   * Generate a fallback post when AI fails
   * @private
   */
  _generateFallbackPost(businessProfile, postOptions) {
    const { contentType, topic, platform } = postOptions;
    
    const templates = [
      `Looking to improve your ${topic}? Our ${businessProfile.niche} solutions can help!`,
      `Want to learn more about ${topic}? Here are 3 tips from our experts.`,
      `${businessProfile.businessName} specializes in ${topic}. Contact us to learn how we can help your business grow!`,
      `Did you know? ${topic} is critical for business success. Here's why...`,
      `We've helped dozens of clients with ${topic}. See how we can help you too!`
    ];
    
    const randomIndex = Math.floor(Math.random() * templates.length);
    const content = templates[randomIndex];
    
    return {
      title: `${topic} - ${businessProfile.businessName}`,
      content,
      hashtags: this._generateFallbackHashtags(businessProfile.industry, 5),
      platform,
      contentType,
      topic,
      tone: 'professional',
      createdAt: new Date().toISOString()
    };
  }
  
  /**
   * Generate fallback hashtags
   * @private
   */
  _generateFallbackHashtags(industry, count) {
    const hashtagsByIndustry = {
      technology: ['#tech', '#innovation', '#digital', '#software', '#coding', '#programming', '#technology', '#developer'],
      marketing: ['#marketing', '#digitalmarketing', '#branding', '#socialmedia', '#contentcreation', '#seo', '#advertising'],
      healthcare: ['#healthcare', '#health', '#wellness', '#medical', '#doctor', '#healthyliving', '#nutrition'],
      fitness: ['#fitness', '#workout', '#gym', '#health', '#training', '#motivation', '#exercise'],
      education: ['#education', '#learning', '#teaching', '#school', '#students', '#onlinelearning', '#knowledge'],
      food: ['#food', '#foodie', '#restaurant', '#delicious', '#instafood', '#cooking', '#chef', '#recipes'],
      fashion: ['#fashion', '#style', '#clothing', '#design', '#outfit', '#accessories', '#model', '#trends'],
      realestate: ['#realestate', '#property', '#home', '#forsale', '#investment', '#realtor', '#housing'],
      travel: ['#travel', '#adventure', '#vacation', '#wanderlust', '#explore', '#travelgram', '#destination'],
      business: ['#business', '#entrepreneur', '#startup', '#success', '#motivation', '#leadership', '#goals']
    };
    
    // Clean up industry string and check if we have hashtags for it
    const cleanIndustry = industry.toLowerCase().replace(/[^a-z]/g, '');
    const hashtags = hashtagsByIndustry[cleanIndustry] || hashtagsByIndustry.business;
    
    // Add some generic hashtags
    const genericHashtags = ['#business', '#growth', '#socialmedia', '#digital', '#success'];
    
    // Combine and shuffle
    const allHashtags = [...hashtags, ...genericHashtags];
    
    // Shuffle array
    for (let i = allHashtags.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allHashtags[i], allHashtags[j]] = [allHashtags[j], allHashtags[i]];
    }
    
    // Return unique hashtags up to count
    return [...new Set(allHashtags)].slice(0, count);
  }
  
  /**
   * Generate fallback content calendar
   * @private
   */
  _generateFallbackCalendar(businessProfile, options) {
    const { month, year, postsPerWeek, platforms } = options;
    
    const contentTypes = ['post', 'story', 'reel', 'carousel'];
    const topics = [
      'Introduction to our services', 
      'Customer testimonial', 
      'Product showcase', 
      'Behind the scenes', 
      'Industry tips', 
      'FAQ', 
      'How-to guide',
      'Meet the team',
      'Special offer',
      'Case study'
    ];
    
    const daysInMonth = new Date(year, new Date(`${month} 1`).getMonth() + 1, 0).getDate();
    const calendar = [];
    
    // Create dates for posts based on posts per week
    const postDates = [];
    const postsNeeded = postsPerWeek * 4; // Approx 4 weeks per month
    
    // Space them out evenly
    const interval = Math.floor(daysInMonth / postsNeeded);
    
    for (let i = 1; i <= postsNeeded; i++) {
      const day = Math.min(i * interval, daysInMonth);
      postDates.push(day);
    }
    
    // Create calendar entries
    postDates.forEach(day => {
      platforms.forEach(platform => {
        const date = `${year}-${String(new Date(`${month} 1`).getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
        const topic = topics[Math.floor(Math.random() * topics.length)];
        
        calendar.push({
          date,
          platform,
          contentType,
          topic,
          description: `Create a ${contentType} about ${topic} for ${businessProfile.businessName}`
        });
      });
    });
    
    return calendar;
  }
  
  /**
   * Generate fallback bio
   * @private
   */
  _generateFallbackBio(businessProfile, platform) {
    const templates = [
      `${businessProfile.businessName} | ${businessProfile.niche} for ${businessProfile.targetAudience || 'businesses'} | Based in ${businessProfile.location || 'your area'} | Contact us for ${businessProfile.industry} solutions`,
      `📈 Helping ${businessProfile.targetAudience || 'businesses'} with ${businessProfile.niche} | ${businessProfile.businessName} | ${businessProfile.location || ''} | Click link to learn more! ⬇️`,
      `${businessProfile.businessName} - ${businessProfile.industry} experts. We specialize in ${businessProfile.niche}. Serving ${businessProfile.location || 'clients worldwide'}. Contact for inquiries. ✉️`
    ];
    
    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }
}

module.exports = new AIService(); 