const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const OpenAIService = require('../services/openaiService');
const Profile = require('../models/Profile');

// @desc    Generate content using OpenAI
// @route   POST /api/ai/generate
// @access  Private
exports.generateContent = asyncHandler(async (req, res, next) => {
  const { apiKey, templateType, profileId } = req.body;

  if (!apiKey) {
    return next(new ErrorResponse('OpenAI API key is required', 400));
  }

  if (!templateType) {
    return next(new ErrorResponse('Template type is required', 400));
  }

  if (!profileId) {
    return next(new ErrorResponse('Profile ID is required', 400));
  }

  // Get the profile from the database
  const profile = await Profile.findById(profileId);

  if (!profile) {
    return next(new ErrorResponse(`Profile not found with id of ${profileId}`, 404));
  }

  // Check if the profile belongs to the logged-in user
  if (profile.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this profile', 401));
  }

  try {
    // Initialize OpenAI service with the provided API key
    const openaiService = new OpenAIService(apiKey);
    
    // Generate content
    const generatedContent = await openaiService.generateContent(profile, templateType);
    
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