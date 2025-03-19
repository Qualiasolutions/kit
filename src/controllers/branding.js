const BusinessProfile = require('../models/BusinessProfile');
const extractColors = require('../utils/colorExtractor');
const { cloudinary } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

// @desc    Extract colors from logo
// @route   POST /api/branding/extract-colors
// @access  Private
exports.extractColorsFromLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a logo image'
      });
    }

    const colors = await extractColors(req.file.filename);

    res.status(200).json({
      success: true,
      data: colors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update brand colors
// @route   PUT /api/branding/colors
// @access  Private
exports.updateBrandColors = async (req, res) => {
  try {
    const { primary, secondary, accent } = req.body;
    
    // Basic validation
    if (!primary && !secondary && !accent) {
      return res.status(400).json({
        success: false,
        error: 'At least one color must be provided'
      });
    }
    
    // Find profile
    const profile = await BusinessProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'No business profile found'
      });
    }
    
    // Update colors
    const updateData = { brandColors: { ...profile.brandColors } };
    
    if (primary) updateData.brandColors.primary = primary;
    if (secondary) updateData.brandColors.secondary = secondary;
    if (accent) updateData.brandColors.accent = accent;
    
    // Update profile
    const updatedProfile = await BusinessProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating brand colors:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update business voice
// @route   PUT /api/branding/voice
// @access  Private
exports.updateBusinessVoice = async (req, res) => {
  try {
    const { businessVoice } = req.body;

    if (!businessVoice || !Array.isArray(businessVoice)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide business voice options as an array'
      });
    }

    if (businessVoice.length > 2) {
      return res.status(400).json({
        success: false,
        error: 'You can select up to 2 business voice options'
      });
    }

    const profile = await BusinessProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'No profile found for this user'
      });
    }

    profile.businessVoice = businessVoice;
    await profile.save();

    res.status(200).json({
      success: true,
      data: profile.businessVoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update logo
// @route   PUT /api/branding/logo
// @access  Private
exports.updateLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // Find profile
    const profile = await BusinessProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'No business profile found'
      });
    }
    
    // Check if we need to delete previous logo
    if (profile.logo && 
        profile.logo !== 'no-logo.png' && 
        profile.logo.includes('cloudinary')) {
      try {
        // Extract public_id
        const publicId = profile.logo.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Error deleting previous logo:', err);
      }
    }
    
    // Create update object with new logo path
    const updateData = { 
      logo: req.file.path || req.file.filename
    };
    
    // Update profile
    const updatedProfile = await BusinessProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating logo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 