const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const OpenAIService = require('../services/openaiService');
const TemplateService = require('../services/templateService');
const BusinessProfile = require('../models/BusinessProfile');
const Post = require('../models/Post');
const { cloudinary, removeBackground } = require('../config/cloudinary');
const { db } = require('../config/firebase');

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