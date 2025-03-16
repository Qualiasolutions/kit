const BusinessProfile = require('../models/BusinessProfile');
const extractColors = require('../utils/colorExtractor');

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

    if (!primary || !secondary || !accent) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all color values'
      });
    }

    const profile = await BusinessProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'No profile found for this user'
      });
    }

    profile.brandColors = {
      primary,
      secondary,
      accent
    };

    await profile.save();

    res.status(200).json({
      success: true,
      data: profile.brandColors
    });
  } catch (error) {
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