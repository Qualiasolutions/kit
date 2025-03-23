const { fabric } = require('fabric');
const fs = require('fs');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const localStorageService = require('./localStorageService');
const { db } = require('../config/firebase');
const { createApi } = require('unsplash-js');
const fetch = require('node-fetch');
const config = require('../config/config');

// Initialize Unsplash API client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || 'YOUR_UNSPLASH_ACCESS_KEY', // Replace with your key when testing
  fetch: fetch,
});

// Template categories that map to Unsplash search queries
const templateCategories = {
  'product-showcase': {
    name: 'Product Showcase',
    description: 'Perfect for highlighting features of products or services',
    searchQueries: ['product', 'showcase', 'marketing'],
    overlay: { position: 'bottom', textColor: 'white', bgOpacity: 0.7 }
  },
  'testimonial': {
    name: 'Testimonial',
    description: 'Highlight customer reviews and feedback',
    searchQueries: ['testimonial', 'review', 'customer success'],
    overlay: { position: 'center', textColor: 'white', bgOpacity: 0.7 }
  },
  'industry-tip': {
    name: 'Industry Tip',
    description: 'Share valuable insights and tips related to your industry',
    searchQueries: ['business tip', 'advice', 'professional'],
    overlay: { position: 'top', textColor: 'white', bgOpacity: 0.6 }
  },
  'promotional-offer': {
    name: 'Promotional Offer',
    description: 'Announce special offers, discounts, or promotions',
    searchQueries: ['sale', 'promotion', 'discount', 'offer'],
    overlay: { position: 'center', textColor: 'white', bgOpacity: 0.6 }
  },
  'event-announcement': {
    name: 'Event Announcement',
    description: 'Promote upcoming events, webinars, or meetups',
    searchQueries: ['event', 'announcement', 'celebration'],
    overlay: { position: 'bottom', textColor: 'white', bgOpacity: 0.7 }
  },
  'company-news': {
    name: 'Company News',
    description: 'Share updates about your business or team',
    searchQueries: ['business news', 'corporate', 'team'],
    overlay: { position: 'top', textColor: 'white', bgOpacity: 0.6 }
  }
};

/**
 * Get all available template categories
 * @returns {Object} Template categories metadata
 */
const getTemplateCategories = () => {
  return Object.keys(templateCategories).map(key => ({
    id: key,
    name: templateCategories[key].name,
    description: templateCategories[key].description
  }));
};

/**
 * Fetch template images for a specific category
 * @param {string} categoryId - The template category ID
 * @param {number} count - Number of templates to fetch (default: 5)
 * @returns {Promise<Array>} - Array of template images with metadata
 */
const getTemplatesByCategory = async (categoryId, count = 5) => {
  try {
    const category = templateCategories[categoryId];
    
    if (!category) {
      throw new Error(`Template category '${categoryId}' not found`);
    }
    
    // Pick a random search query from the category
    const searchQuery = category.searchQueries[Math.floor(Math.random() * category.searchQueries.length)];
    
    // Fetch images from Unsplash
    const result = await unsplash.search.getPhotos({
      query: searchQuery,
      orientation: 'landscape',
      perPage: count
    });
    
    if (result.errors) {
      throw new Error(`Unsplash API error: ${result.errors[0]}`);
    }
    
    // Process and return template data
    return result.response.results.map(photo => ({
      id: photo.id,
      categoryId: categoryId,
      categoryName: category.name,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.small,
      authorName: photo.user.name,
      authorUrl: photo.user.links.html,
      overlay: category.overlay,
      downloadUrl: photo.links.download
    }));
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

/**
 * Fetch a specific template by its ID
 * @param {string} templateId - The template ID from Unsplash
 * @returns {Promise<Object>} - Template metadata
 */
const getTemplateById = async (templateId) => {
  try {
    const result = await unsplash.photos.get({ photoId: templateId });
    
    if (result.errors) {
      throw new Error(`Unsplash API error: ${result.errors[0]}`);
    }
    
    const photo = result.response;
    
    // Try to match the photo to a category based on its tags or description
    let matchedCategory = null;
    
    for (const [categoryId, category] of Object.entries(templateCategories)) {
      const photoTags = (photo.tags || []).map(tag => tag.title.toLowerCase());
      const photoDescription = photo.description ? photo.description.toLowerCase() : '';
      
      const hasMatchingTag = category.searchQueries.some(query => 
        photoTags.some(tag => tag.includes(query.toLowerCase()))
      );
      
      const hasMatchingDescription = category.searchQueries.some(query =>
        photoDescription.includes(query.toLowerCase())
      );
      
      if (hasMatchingTag || hasMatchingDescription) {
        matchedCategory = { id: categoryId, ...category };
        break;
      }
    }
    
    // Default to product showcase if we can't find a match
    if (!matchedCategory) {
      matchedCategory = { 
        id: 'product-showcase', 
        ...templateCategories['product-showcase'] 
      };
    }
    
    return {
      id: photo.id,
      categoryId: matchedCategory.id,
      categoryName: matchedCategory.name,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.small,
      authorName: photo.user.name,
      authorUrl: photo.user.links.html,
      overlay: matchedCategory.overlay,
      downloadUrl: photo.links.download
    };
  } catch (error) {
    console.error('Error fetching template by ID:', error);
    throw error;
  }
};

/**
 * Search for templates using a keyword
 * @param {string} keyword - Search keyword
 * @param {number} page - Page number
 * @param {number} perPage - Results per page
 * @returns {Promise<Object>} - Search results
 */
const searchTemplates = async (keyword, page = 1, perPage = 10) => {
  try {
    const result = await unsplash.search.getPhotos({
      query: keyword,
      page,
      perPage
    });
    
    if (result.errors) {
      throw new Error(`Unsplash API error: ${result.errors[0]}`);
    }
    
    const photos = result.response.results.map(photo => {
      // Try to match to a category
      let matchedCategory = null;
      
      for (const [categoryId, category] of Object.entries(templateCategories)) {
        const photoTags = (photo.tags || []).map(tag => tag.title.toLowerCase());
        
        const hasMatchingTag = category.searchQueries.some(query => 
          photoTags.some(tag => tag.includes(query.toLowerCase()))
        );
        
        if (hasMatchingTag) {
          matchedCategory = { id: categoryId, ...category };
          break;
        }
      }
      
      // Default to product showcase if we can't find a match
      if (!matchedCategory) {
        matchedCategory = { 
          id: 'product-showcase', 
          ...templateCategories['product-showcase'] 
        };
      }
      
      return {
        id: photo.id,
        categoryId: matchedCategory.id,
        categoryName: matchedCategory.name,
        url: photo.urls.regular,
        thumbnailUrl: photo.urls.small,
        authorName: photo.user.name,
        authorUrl: photo.user.links.html,
        overlay: matchedCategory.overlay,
        downloadUrl: photo.links.download
      };
    });
    
    return {
      results: photos,
      total: result.response.total,
      totalPages: result.response.total_pages
    };
  } catch (error) {
    console.error('Error searching templates:', error);
    throw error;
  }
};

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
    
    // Attempt to load templates from Firestore on init
    this.initTemplates();
  }
  
  /**
   * Initialize templates from Firestore or local storage
   */
  async initTemplates() {
    try {
      // Try to load templates from Firebase
      const templatesSnapshot = await db.collection('templates').get();
      
      if (!templatesSnapshot.empty) {
        const templates = {};
        templatesSnapshot.forEach(doc => {
          const data = doc.data();
          templates[doc.id] = {
            name: data.name,
            description: data.description,
            platforms: data.platforms || ['instagram', 'facebook'],
            imageUrl: data.imageUrl
          };
        });
        
        // Update template library with data from Firestore
        this.templateLibrary = { ...this.templateLibrary, ...templates };
        console.log('Templates loaded from Firestore');
        
        // Also save to local storage as backup
        Object.entries(templates).forEach(async ([id, template]) => {
          await localStorageService.saveData('templates', id, template);
        });
      }
    } catch (firestoreError) {
      console.warn('Failed to load templates from Firestore:', firestoreError.message);
      
      try {
        // Try to load from local storage
        const localTemplates = await localStorageService.getAllData('templates');
        
        if (localTemplates && localTemplates.length > 0) {
          const templates = {};
          localTemplates.forEach(template => {
            templates[template.id] = {
              name: template.name,
              description: template.description,
              platforms: template.platforms || ['instagram', 'facebook'],
              imageUrl: template.imageUrl
            };
          });
          
          // Update template library with local data
          this.templateLibrary = { ...this.templateLibrary, ...templates };
          console.log('Templates loaded from local storage');
        } else {
          // No templates in local storage, use fallback data and save it
          const fallbackTemplates = require('../utils/fallbackData').templates;
          
          fallbackTemplates.forEach(async template => {
            await localStorageService.saveData('templates', template.id, template);
          });
          
          console.log('Using default template library');
        }
      } catch (localError) {
        console.error('Failed to load templates from local storage:', localError.message);
        console.log('Using default template library');
      }
    }
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

module.exports = {
  getTemplateCategories,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,
  TemplateService
}; 