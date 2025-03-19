const { fabric } = require('fabric');
const fs = require('fs');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Template service for creating and managing post templates
 */
class TemplateService {
  constructor() {
    this.templateLibrary = {
      standard: {
        name: 'Standard Post',
        description: 'Clean, professional layout for general content',
        platforms: ['instagram', 'facebook', 'twitter', 'linkedin']
      },
      promotional: {
        name: 'Promotional',
        description: 'Eye-catching design for sales and promotions',
        platforms: ['instagram', 'facebook', 'twitter', 'linkedin']
      },
      news: {
        name: 'News Update',
        description: 'Formal layout for announcements and news',
        platforms: ['instagram', 'facebook', 'twitter', 'linkedin']
      },
      event: {
        name: 'Event Promotion',
        description: 'Showcase upcoming events with style',
        platforms: ['instagram', 'facebook', 'twitter', 'linkedin']
      },
      real_estate: {
        name: 'Real Estate',
        description: 'Property showcase with details',
        platforms: ['instagram', 'facebook']
      },
      food: {
        name: 'Food & Restaurant',
        description: 'Highlight menu items and special offers',
        platforms: ['instagram', 'facebook']
      }
    };
    
    this.platformSizes = {
      instagram: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook: { width: 1200, height: 630 },
      twitter: { width: 1024, height: 512 },
      linkedin: { width: 1200, height: 627 }
    };
  }

  /**
   * Get all available templates
   * @returns {Array} List of templates
   */
  getAllTemplates() {
    return Object.entries(this.templateLibrary).map(([id, template]) => ({
      id,
      ...template
    }));
  }

  /**
   * Get templates by business type
   * @param {string} businessType - Type of business
   * @returns {Array} Filtered templates
   */
  getTemplatesByBusinessType(businessType) {
    // Logic to filter templates based on business type
    // For now, return all templates
    return this.getAllTemplates();
  }

  /**
   * Generate a post template using Fabric.js
   * @param {Object} options - Template options
   * @param {string} options.templateId - Template ID
   * @param {string} options.platform - Social media platform
   * @param {Object} options.branding - Business branding info
   * @param {Object} options.content - Post content
   * @param {string} options.imageUrl - Background image URL
   * @returns {Promise<Object>} Generated template data
   */
  async generateTemplate(options) {
    const { templateId, platform, branding, content, imageUrl } = options;
    
    // Get platform dimensions
    const dimensions = this.platformSizes[platform] || this.platformSizes.instagram;
    
    // Create Fabric.js canvas
    const canvas = new fabric.StaticCanvas(null, {
      width: dimensions.width,
      height: dimensions.height
    });
    
    try {
      // Set background color
      canvas.setBackgroundColor(branding.primaryColor || '#ffffff', canvas.renderAll.bind(canvas));
      
      // Add background image if provided
      if (imageUrl) {
        await new Promise((resolve, reject) => {
          fabric.Image.fromURL(imageUrl, (img) => {
            img.scaleToWidth(dimensions.width);
            canvas.add(img);
            resolve();
          }, { crossOrigin: 'anonymous' });
        });
      }
      
      // Add headline
      const headline = new fabric.Text(content.headline, {
        left: dimensions.width / 2,
        top: 50,
        fontSize: 40,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: branding.secondaryColor || '#000000',
        originX: 'center',
        textAlign: 'center'
      });
      canvas.add(headline);
      
      // Add main text
      const mainText = new fabric.Text(content.mainText, {
        left: dimensions.width / 2,
        top: 120,
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#000000',
        originX: 'center',
        textAlign: 'center',
        width: dimensions.width * 0.8
      });
      canvas.add(mainText);
      
      // Add call to action
      const cta = new fabric.Text(content.callToAction, {
        left: dimensions.width / 2,
        top: dimensions.height - 100,
        fontSize: 30,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: branding.accentColor || '#ff0000',
        originX: 'center',
        textAlign: 'center'
      });
      canvas.add(cta);
      
      // Add logo if available
      if (branding.logoUrl) {
        await new Promise((resolve, reject) => {
          fabric.Image.fromURL(branding.logoUrl, (img) => {
            img.scaleToHeight(60);
            img.set({
              left: 50,
              top: dimensions.height - 70
            });
            canvas.add(img);
            resolve();
          }, { crossOrigin: 'anonymous' });
        });
      }
      
      // Render the canvas
      canvas.renderAll();
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1
      });
      
      return {
        templateId,
        platform,
        dimensions,
        dataUrl,
        content
      };
    } catch (error) {
      console.error('Template generation error:', error);
      throw new ErrorResponse('Failed to generate template', 500);
    }
  }
  
  /**
   * Resize template for different platforms
   * @param {Object} templateData - Original template data
   * @param {Array} platforms - Target platforms
   * @returns {Promise<Array>} Array of resized templates
   */
  async resizeForPlatforms(templateData, platforms) {
    const results = [];
    
    for (const platform of platforms) {
      // Clone the template data
      const resizedData = { ...templateData };
      
      // Update the platform and dimensions
      resizedData.platform = platform;
      resizedData.dimensions = this.platformSizes[platform];
      
      // Generate a new template for this platform
      const resizedTemplate = await this.generateTemplate({
        templateId: templateData.templateId,
        platform,
        branding: resizedData.branding,
        content: resizedData.content,
        imageUrl: resizedData.imageUrl
      });
      
      results.push(resizedTemplate);
    }
    
    return results;
  }
}

module.exports = TemplateService; 