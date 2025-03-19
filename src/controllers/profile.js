const BusinessProfile = require('../models/BusinessProfile');
const Industry = require('../models/Industry');
const extractColors = require('../utils/colorExtractor');
const localStorageService = require('../services/localStorageService');

// @desc    Get all industries with niches
// @route   GET /api/profile/industries
// @access  Public
exports.getIndustries = async (req, res) => {
  try {
    let industries;
    
    try {
      industries = await Industry.find();
    } catch (dbError) {
      console.warn('MongoDB query failed, using local storage fallback:', dbError.message);
      industries = await localStorageService.getAllData('industries');
      
      // If no industries in local storage, use hardcoded fallback
      if (!industries || industries.length === 0) {
        industries = require('../utils/fallbackData').industries;
        
        // Save to local storage for future use
        for (const industry of industries) {
          await localStorageService.saveData('industries', industry.name.toLowerCase().replace(/\s+/g, '-'), industry);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: industries
    });
  } catch (error) {
    console.error('getIndustries error:', error);
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
        try {
          const extractedColors = await extractColors(req.file.filename);
          profileData.brandColors = extractedColors;
        } catch (colorError) {
          console.warn('Color extraction failed:', colorError.message);
          profileData.brandColors = {
            primary: '#4254f5',
            secondary: '#271e80',
            accent: '#e5297e'
          };
        }
      } else {
        profileData.brandColors = brandColors;
      }
    } else if (brandColors) {
      profileData.brandColors = brandColors;
    }

    let profile;
    
    try {
      // Check if profile already exists in MongoDB
      profile = await BusinessProfile.findOne({ user: req.user.id });
      
      if (profile) {
        // Update in MongoDB
        profile = await BusinessProfile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileData },
          { new: true, runValidators: true }
        );
      } else {
        // Create in MongoDB
        profile = await BusinessProfile.create(profileData);
      }
    } catch (dbError) {
      console.warn('MongoDB operation failed, using local storage fallback:', dbError.message);
      
      // Try to get profile from local storage
      const localProfile = await localStorageService.getData('business-profiles', req.user.id);
      
      if (localProfile) {
        // Update in local storage
        profile = await localStorageService.saveData('business-profiles', req.user.id, {
          ...localProfile,
          ...profileData,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create in local storage
        profile = await localStorageService.saveData('business-profiles', req.user.id, {
          ...profileData,
          createdAt: new Date().toISOString()
        });
      }
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
    let profile;
    
    try {
      profile = await BusinessProfile.findOne({ user: req.user.id });
    } catch (dbError) {
      console.warn('MongoDB query failed, using local storage fallback:', dbError.message);
      profile = await localStorageService.getData('business-profiles', req.user.id);
    }

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
    console.error('getProfile error:', error);
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