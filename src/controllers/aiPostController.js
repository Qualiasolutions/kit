const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const OpenAIService = require('../services/openaiService');
const TemplateService = require('../services/templateService');
const BusinessProfile = require('../models/BusinessProfile');
const Post = require('../models/Post');
const { cloudinary, removeBackground } = require('../config/cloudinary');
const { db } = require('../config/firebase');
const aiService = require('../services/aiService');
const localStorageService = require('../services/localStorageService');

// Initialize template service
const templateService = new TemplateService();

// @desc    Get all available templates
// @route   GET /api/ai-posts/templates
// @access  Private
exports.getTemplates = asyncHandler(async (req, res, next) => {
  // If business type is provided, filter templates
  const { businessType } = req.query;
  
  let templates;
  if (businessType) {
    templates = templateService.getTemplatesByBusinessType(businessType);
  } else {
    templates = templateService.getAllTemplates();
  }
  
  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates
  });
});

// @desc    Detect branding from business profile
// @route   GET /api/ai-posts/detect-branding
// @access  Private
exports.detectBranding = asyncHandler(async (req, res, next) => {
  // Get business profile for the user
  const businessProfile = await BusinessProfile.findOne({ user: req.user.id });
  
  if (!businessProfile) {
    return next(new ErrorResponse('Please create a business profile first', 400));
  }
  
  // Extract branding information
  const branding = {
    name: businessProfile.name,
    logo: businessProfile.logo,
    primaryColor: businessProfile.brandColors?.primary || '#000000',
    secondaryColor: businessProfile.brandColors?.secondary || '#ffffff',
    accentColor: businessProfile.brandColors?.accent || '#ff0000',
    fontFamily: businessProfile.brandFonts?.primary || 'Arial'
  };
  
  res.status(200).json({
    success: true,
    data: branding
  });
});

// @desc    Generate content using OpenAI
// @route   POST /api/ai-posts/generate-content
// @access  Private
exports.generateContent = asyncHandler(async (req, res, next) => {
  const { templateId, callToAction } = req.body;
  
  if (!templateId) {
    return next(new ErrorResponse('Template ID is required', 400));
  }
  
  // Get business profile
  const businessProfile = await BusinessProfile.findOne({ user: req.user.id });
  
  if (!businessProfile) {
    return next(new ErrorResponse('Please create a business profile first', 400));
  }
  
  // Get template info
  const template = templateService.templateLibrary[templateId];
  if (!template) {
    return next(new ErrorResponse('Invalid template ID', 400));
  }
  
  try {
    // Initialize OpenAI service with API key from environment
    const openaiService = new OpenAIService(process.env.OPENAI_API_KEY);
    
    // Create profile object for OpenAI
    const profile = {
      name: businessProfile.name,
      industry: businessProfile.industry,
      tone: businessProfile.brandVoice?.tone || 'Professional',
      targetAudience: businessProfile.targetAudience?.join(', ') || 'General',
      keyValues: businessProfile.brandValues?.join(', ') || 'Quality, Service',
      keyProducts: businessProfile.products?.join(', ') || 'Various services',
      description: businessProfile.description || 'A business serving customers with quality products and services'
    };
    
    // Add CTA info to the profile for better content generation
    if (callToAction) {
      profile.callToAction = callToAction;
    }
    
    // Generate content
    const generatedContent = await openaiService.generateContent(profile, template.name);
    
    res.status(200).json({
      success: true,
      data: generatedContent
    });
  } catch (error) {
    return next(
      new ErrorResponse(
        error.message || 'Failed to generate content',
        error.statusCode || 500
      )
    );
  }
});

// @desc    Process image (upload and remove background)
// @route   POST /api/ai-posts/process-image
// @access  Private
exports.processImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload an image', 400));
  }
  
  const { removeBackground: shouldRemoveBackground } = req.body;
  
  try {
    // Image has been uploaded to Cloudinary via middleware
    let imageData = {
      url: req.file.path,
      publicId: req.file.filename
    };
    
    // Remove background if requested
    if (shouldRemoveBackground === 'true') {
      const result = await removeBackground(imageData.publicId);
      imageData = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }
    
    res.status(200).json({
      success: true,
      data: imageData
    });
  } catch (error) {
    console.error('Image processing error:', error);
    return next(new ErrorResponse('Failed to process image', 500));
  }
});

// @desc    Generate template preview
// @route   POST /api/ai-posts/preview-template
// @access  Private
exports.previewTemplate = asyncHandler(async (req, res, next) => {
  const { 
    templateId, 
    platform, 
    content, 
    imageUrl, 
    branding 
  } = req.body;
  
  if (!templateId || !platform || !content) {
    return next(new ErrorResponse('Template ID, platform, and content are required', 400));
  }
  
  try {
    // Generate template preview
    const template = await templateService.generateTemplate({
      templateId,
      platform,
      branding,
      content,
      imageUrl
    });
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Template preview error:', error);
    return next(new ErrorResponse('Failed to generate template preview', 500));
  }
});

// @desc    Create post for multiple platforms
// @route   POST /api/ai-posts/create
// @access  Private
exports.createPost = asyncHandler(async (req, res, next) => {
  const { 
    templateId,
    content,
    imageUrl,
    platforms, 
    scheduledDate,
    status = 'draft'
  } = req.body;
  
  if (!templateId || !content) {
    return next(new ErrorResponse('Template ID and content are required', 400));
  }
  
  // Get business profile
  const businessProfile = await BusinessProfile.findOne({ user: req.user.id });
  
  if (!businessProfile) {
    return next(new ErrorResponse('Please create a business profile first', 400));
  }
  
  try {
    // Get branding info
    const branding = {
      name: businessProfile.name,
      logoUrl: businessProfile.logo,
      primaryColor: businessProfile.brandColors?.primary || '#000000',
      secondaryColor: businessProfile.brandColors?.secondary || '#ffffff',
      accentColor: businessProfile.brandColors?.accent || '#ff0000'
    };
    
    // Generate templates for all requested platforms
    const templateData = {
      templateId,
      platform: platforms[0] || 'instagram',
      branding,
      content,
      imageUrl
    };
    
    // Generate templates for all requested platforms
    const templates = await templateService.resizeForPlatforms(templateData, platforms);
    
    // Create posts for each platform
    const posts = [];
    
    for (const template of templates) {
      const postData = {
        user: req.user.id,
        businessProfile: businessProfile._id,
        content: content.mainText,
        headline: content.headline,
        callToAction: content.callToAction,
        hashtags: content.tags ? content.tags.join(' ') : '',
        imageUrl: template.dataUrl,
        imageDescription: content.imagePrompt || '',
        template: templateId,
        platform: template.platform,
        scheduledDate: scheduledDate || null,
        status
      };
      
      const post = await Post.create(postData);
      posts.push(post);
    }
    
    res.status(201).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Post creation error:', error);
    return next(new ErrorResponse('Failed to create post', 500));
  }
});

// @desc    Generate a social media post
// @route   POST /api/posts/generate
// @access  Private
exports.generatePost = asyncHandler(async (req, res, next) => {
  const { topic, platform, contentType, tone, includeHashtags } = req.body;
  
  // Validate required fields
  if (!topic || !platform || !contentType) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: topic, platform, and contentType are required'
    });
  }
  
  try {
    // Generate content using AI service
    const generatedContent = await aiService.generatePostContent({
      topic,
      platform,
      contentType,
      tone: tone || 'professional',
      includeHashtags: includeHashtags !== false // Default to true
    });
    
    // Return generated content
    return res.status(200).json({
      success: true,
      data: generatedContent
    });
  } catch (error) {
    console.error('Error in generatePost controller:', error);
    
    // Return a fallback if AI generation fails
    const fallbackContent = aiService.generateFallbackContent({
      topic: req.body.topic || 'your business',
      platform: req.body.platform || 'social media',
      contentType: req.body.contentType || 'post',
      tone: req.body.tone || 'professional'
    });
    
    return res.status(200).json({
      success: true,
      data: fallbackContent,
      warning: 'Used fallback content generation due to an error'
    });
  }
});

// @desc    Generate hashtags for a post
// @route   POST /api/posts/hashtags
// @access  Private
exports.generateHashtags = asyncHandler(async (req, res, next) => {
  const { content, count } = req.body;
  
  // Validate required fields
  if (!content) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: content is required'
    });
  }
  
  try {
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
});

// @desc    Generate content calendar
// @route   POST /api/posts/calendar
// @access  Private
exports.generateContentCalendar = asyncHandler(async (req, res, next) => {
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
  
  try {
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
});

// @desc    Generate bio for profile
// @route   POST /api/posts/bio
// @access  Private
exports.generateBio = asyncHandler(async (req, res, next) => {
  const { platform } = req.body;
  
  if (!platform) {
    return next(new ErrorResponse('Please provide platform', 400));
  }
  
  try {
    // Get business profile for the user
    const businessProfile = await localStorageService.getData('businessProfiles', req.user.id);
    
    if (!businessProfile) {
      return next(new ErrorResponse('Business profile not found', 404));
    }
    
    // Generate bio
    const bio = await aiService.generateProfileBio({
      platform,
      businessType: businessProfile.industry || 'general'
    });
    
    res.status(200).json({
      success: true,
      data: bio
    });
  } catch (error) {
    console.error('Error generating bio:', error);
    return next(new ErrorResponse('Error generating bio', 500));
  }
});

// @desc    Get all posts for user
// @route   GET /api/posts
// @access  Private
exports.getPosts = asyncHandler(async (req, res, next) => {
  try {
    // Query posts for this user
    const posts = await localStorageService.findData('posts', post => post.userId === req.user.id);
    
    // Sort by created date, newest first
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return next(new ErrorResponse('Error fetching posts', 500));
  }
});

// @desc    Get a post
// @route   GET /api/posts/:id
// @access  Private
exports.getPost = asyncHandler(async (req, res, next) => {
  try {
    const post = await localStorageService.getData('posts', req.params.id);
    
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    // Check if post belongs to user
    if (post.userId !== req.user.id) {
      return next(new ErrorResponse('Not authorized to access this post', 401));
    }
    
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return next(new ErrorResponse('Error fetching post', 500));
  }
});

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = asyncHandler(async (req, res, next) => {
  try {
    const post = await localStorageService.getData('posts', req.params.id);
    
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    // Check if post belongs to user
    if (post.userId !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this post', 401));
    }
    
    // Fields to update
    const updatedFields = {
      title: req.body.title,
      content: req.body.content,
      hashtags: req.body.hashtags,
      isScheduled: req.body.isScheduled,
      scheduledDate: req.body.scheduledDate,
      status: req.body.status,
      platform: req.body.platform,
      contentType: req.body.contentType,
      updatedAt: new Date().toISOString()
    };
    
    // Remove undefined fields
    Object.keys(updatedFields).forEach(key => 
      updatedFields[key] === undefined && delete updatedFields[key]
    );
    
    // Update post
    const updatedPost = {
      ...post,
      ...updatedFields
    };
    
    await localStorageService.saveData('posts', req.params.id, updatedPost);
    
    res.status(200).json({
      success: true,
      data: updatedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return next(new ErrorResponse('Error updating post', 500));
  }
});

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = asyncHandler(async (req, res, next) => {
  try {
    const post = await localStorageService.getData('posts', req.params.id);
    
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    // Check if post belongs to user
    if (post.userId !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this post', 401));
    }
    
    // Delete post
    await localStorageService.deleteData('posts', req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return next(new ErrorResponse('Error deleting post', 500));
  }
});

/**
 * Generate a fallback content calendar
 * @private
 * @param {Object} options - Calendar options
 * @returns {Object} - Fallback content calendar
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