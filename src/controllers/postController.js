const Post = require('../models/Post');
const BusinessProfile = require('../models/BusinessProfile');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const axios = require('axios');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = asyncHandler(async (req, res, next) => {
  // Add user to request body
  req.body.user = req.user.id;

  // Check if business profile exists
  const businessProfile = await BusinessProfile.findOne({ user: req.user.id });
  
  if (!businessProfile) {
    return next(new ErrorResponse('Please create a business profile first', 400));
  }

  // Add business profile to request
  req.body.businessProfile = businessProfile._id;

  // Create post
  const post = await Post.create(req.body);

  res.status(201).json({
    success: true,
    data: post
  });
});

// @desc    Get all posts for a user
// @route   GET /api/posts
// @access  Private
exports.getPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts
  });
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the post
  if (post.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to access this post`, 401));
  }

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the post
  if (post.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to update this post`, 401));
  }

  post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the post
  if (post.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to delete this post`, 401));
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get scheduled posts
// @route   GET /api/posts/scheduled
// @access  Private
exports.getScheduledPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find({ 
    user: req.user.id,
    status: 'scheduled',
    scheduledDate: { $gte: new Date() }
  }).sort({ scheduledDate: 1 });

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts
  });
});

// @desc    Update post status
// @route   PUT /api/posts/:id/status
// @access  Private
exports.updatePostStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status || !['draft', 'scheduled', 'published', 'archived'].includes(status)) {
    return next(new ErrorResponse('Please provide a valid status', 400));
  }

  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the post
  if (post.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to update this post`, 401));
  }

  post = await Post.findByIdAndUpdate(
    req.params.id, 
    { status }, 
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Generate post content with OpenAI
// @route   POST /api/posts/generate
// @access  Private
exports.generatePost = asyncHandler(async (req, res, next) => {
  const { businessData, templateId, generateImage } = req.body;

  if (!businessData) {
    return next(new ErrorResponse('Business data is required', 400));
  }

  if (!templateId) {
    return next(new ErrorResponse('Template ID is required', 400));
  }

  try {
    // Map template ID to a descriptive name
    const templateTypes = {
      'template-1': 'Modern & Clean',
      'template-2': 'Bold & Colorful',
      'template-3': 'Business Special',
      'template-4': 'Minimalist',
      'template-5': 'Gradient Style',
      'template-6': 'Creative Layout',
      'template-7': 'Seasonal Promo',
      'template-8': 'Product Showcase',
      'template-9': 'Quote Template',
      'template-10': 'Call to Action'
    };
    
    const templateType = templateTypes[templateId] || 'Standard';
    
    // Build the prompt for OpenAI
    const prompt = `
Create engaging social media content for a business with the following profile:

Business Name: ${businessData.name}
Industry/Type: ${businessData.type}
Colors: Primary: ${businessData.colors.primary}, Secondary: ${businessData.colors.secondary}, Accent: ${businessData.colors.accent}
Description: ${businessData.description || 'A business providing quality products and services'}

Create content for a "${templateType}" template.

Please provide the following in JSON format:
{
  "headline": "Attention-grabbing headline",
  "caption": "Main post content that showcases the business value (2-3 sentences)",
  "callToAction": "Clear call to action",
  "hashtags": "5 relevant hashtags with # symbol",
  "imageDescription": "A detailed description for generating an image that would work well with this post"
}

The content should reflect the business's brand colors, appeal to their target audience, and be optimized for social media engagement.
    `;
    
    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
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
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    
    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      throw new Error('Failed to generate content');
    }
    
    // Parse the generated content
    const content = parseGeneratedContent(response.data.choices[0].message.content);
    
    res.status(200).json({
      success: true,
      content
    });
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return next(new ErrorResponse('Invalid OpenAI API key', 401));
    }
    
    return next(new ErrorResponse(
      error.response?.data?.error?.message || 'Failed to generate content',
      error.response?.status || 500
    ));
  }
});

// Helper function to parse the generated content
function parseGeneratedContent(content) {
  try {
    // Extract JSON from the response (in case there's additional text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in the generated content');
    }
    
    const jsonContent = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    const requiredFields = ['headline', 'caption', 'callToAction', 'hashtags', 'imageDescription'];
    for (const field of requiredFields) {
      if (!jsonContent[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    return jsonContent;
  } catch (error) {
    console.error('Error parsing generated content:', error);
    throw new Error('Failed to parse generated content');
  }
} 