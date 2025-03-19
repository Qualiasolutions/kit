const BusinessProfile = require('../models/BusinessProfile');
const Industry = require('../models/Industry');
const extractColors = require('../utils/colorExtractor');

// @desc    Get all industries with niches
// @route   GET /api/profile/industries
// @access  Public
exports.getIndustries = async (req, res) => {
  try {
    const industries = await Industry.find();
    
    res.status(200).json({
      success: true,
      data: industries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create or update business profile
// @route   POST /api/profile
// @access  Private
exports.createProfile = async (req, res) => {
  try {
    const {
      businessName,
      industry,
      niche,
      brandColors,
      businessVoice,
      targetAudience,
      locationType,
      location,
      website,
      contactDetails,
      socialPlatforms
    } = req.body;

    // Check if profile already exists
    let profile = await BusinessProfile.findOne({ user: req.user.id });

    const profileData = {
      user: req.user.id,
      businessName,
      industry,
      niche,
      businessVoice,
      targetAudience,
      locationType,
      location,
      website,
      contactDetails,
      socialPlatforms
    };

    // Add logo if uploaded
    if (req.file) {
      // Store the full URL if using Cloudinary
      if (req.file.path && req.file.path.includes('cloudinary')) {
        profileData.logo = req.file.path;
      } else {
        // For local storage, store the filename
        profileData.logo = req.file.filename;
      }
      
      // Extract colors from logo if not provided
      if (!brandColors) {
        const extractedColors = await extractColors(req.file.filename);
        profileData.brandColors = extractedColors;
      } else {
        profileData.brandColors = brandColors;
      }
    } else if (brandColors) {
      profileData.brandColors = brandColors;
    }

    if (profile) {
      // Update
      profile = await BusinessProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileData },
        { new: true, runValidators: true }
      );
    } else {
      // Create
      profile = await BusinessProfile.create(profileData);
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get current user's business profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'No profile found for this user'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get suggested target audiences based on niche
// @route   GET /api/profile/target-audiences/:industry/:niche
// @access  Private
exports.getSuggestedAudiences = async (req, res) => {
  try {
    const { industry, niche } = req.params;
    
    // This would typically come from a database or AI service
    // For now, we'll return some sample audiences based on industry
    let suggestedAudiences = [];
    
    switch(industry) {
      case 'Automotive':
        suggestedAudiences = [
          'Car owners looking for maintenance',
          'New car buyers',
          'Auto enthusiasts',
          'Commuters',
          'Families needing reliable transportation'
        ];
        break;
      case 'Beauty & Personal Care':
        suggestedAudiences = [
          'Beauty enthusiasts',
          'Working professionals',
          'Teenagers and young adults',
          'Eco-conscious consumers',
          'Luxury shoppers'
        ];
        break;
      // Add more industries as needed
      default:
        suggestedAudiences = [
          'Local customers',
          'Online shoppers',
          'Budget-conscious consumers',
          'Premium service seekers',
          'Repeat customers'
        ];
    }
    
    res.status(200).json({
      success: true,
      data: suggestedAudiences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 