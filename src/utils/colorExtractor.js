const ColorThief = require('colorthief');
const path = require('path');

/**
 * Extract colors from an image
 * @param {string} imagePath - Path to the image
 * @returns {Object} - Object containing primary, secondary, and accent colors
 */
const extractColors = async (imagePath) => {
  try {
    const fullPath = path.join(__dirname, '../uploads', imagePath);
    
    // Get dominant color and palette
    const dominantColor = await ColorThief.getColor(fullPath);
    const palette = await ColorThief.getPalette(fullPath, 5);
    
    // Convert RGB to HEX
    const primaryColor = rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2]);
    const secondaryColor = rgbToHex(palette[1][0], palette[1][1], palette[1][2]);
    const accentColor = rgbToHex(palette[3][0], palette[3][1], palette[3][2]);
    
    return {
      primary: primaryColor,
      secondary: secondaryColor,
      accent: accentColor
    };
  } catch (error) {
    console.error('Error extracting colors:', error);
    return {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#cccccc'
    };
  }
};

/**
 * Convert RGB to HEX
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 * @returns {string} - HEX color code
 */
const rgbToHex = (r, g, b) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

module.exports = extractColors; 