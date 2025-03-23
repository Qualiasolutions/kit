const { fabric } = require('fabric');
const fs = require('fs');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const localStorageService = require('./localStorageService');
const { createApi } = require('unsplash-js');
const fetch = require('node-fetch');
const config = require('../config/config');

// Initialize Unsplash API client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: fetch,
});

// Verify the API key is available
if (!process.env.UNSPLASH_ACCESS_KEY) {
  console.warn('Warning: Unsplash API key not found in environment variables. Template functionality will be limited.');
}

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
    
    // Check if we received a rate limiting error
    if (result.type === 'error') {
      if (result.status === 403) {
        console.error('Unsplash API rate limit exceeded. Using fallback templates.');
        return getFallbackTemplates(categoryId, count);
      }
      throw new Error(`Unsplash API error: ${result.errors || 'Unknown error'}`);
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
      downloadUrl: photo.links.download,
      attribution: `Photo by ${photo.user.name} on Unsplash`
    }));
  } catch (error) {
    console.error('Error fetching templates:', error);
    
    // Return fallback templates if API call fails
    return getFallbackTemplates(categoryId, count);
  }
};

/**
 * Get fallback templates when Unsplash API fails
 * @param {string} categoryId - The template category ID
 * @param {number} count - Number of templates to return
 * @returns {Array} - Array of fallback templates
 */
const getFallbackTemplates = (categoryId, count) => {
  const category = templateCategories[categoryId];
  if (!category) {
    return [];
  }
  
  // Create a single fallback template for the category
  return [{
    id: categoryId,
    categoryId: categoryId,
    categoryName: category.name,
    url: `img/templates/${categoryId}.jpg`,
    thumbnailUrl: `img/templates/${categoryId}.jpg`,
    authorName: 'OmuMediaKit',
    authorUrl: '#',
    overlay: category.overlay,
    downloadUrl: null,
    attribution: 'Default template'
  }];
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
    this.collectionName = 'templates';
    this.templateCache = {};
    
    // Initialize with some default templates
    this.initTemplates().catch(err => {
      console.error('Error initializing templates:', err);
    });
  }
  
  /**
   * Initialize the templates in local storage
   */
  async initTemplates() {
    try {
      // Check if templates already exist in local storage
      const existingTemplates = await localStorageService.getAllData(this.collectionName);
      
      if (existingTemplates.length > 0) {
        console.log(`${existingTemplates.length} templates already exist in storage`);
        return;
      }
      
      console.log('Initializing default templates in local storage');
      
      // Example templates to initialize
      const defaultTemplates = [
        {
          id: 'default-product-1',
          name: 'Product Template 1',
          businessType: 'product',
          imageUrl: '/img/templates/product-showcase.jpg',
          thumbnailUrl: '/img/templates/product-showcase.jpg',
          authorName: 'OmuMediaKit',
          overlay: templateCategories['product-showcase'].overlay
        },
        {
          id: 'default-service-1',
          name: 'Service Template 1',
          businessType: 'service',
          imageUrl: '/img/templates/testimonial.jpg',
          thumbnailUrl: '/img/templates/testimonial.jpg',
          authorName: 'OmuMediaKit',
          overlay: templateCategories['testimonial'].overlay
        },
        {
          id: 'default-event-1',
          name: 'Event Template 1',
          businessType: 'event',
          imageUrl: '/img/templates/event-announcement.jpg',
          thumbnailUrl: '/img/templates/event-announcement.jpg',
          authorName: 'OmuMediaKit',
          overlay: templateCategories['event-announcement'].overlay
        }
      ];
      
      // Save default templates to local storage
      for (const template of defaultTemplates) {
        await localStorageService.saveData(this.collectionName, template.id, template);
      }
      
      console.log(`${defaultTemplates.length} default templates initialized in local storage`);
    } catch (error) {
      console.error('Error initializing templates:', error);
    }
  }
  
  /**
   * Get all templates
   * @returns {Promise<Array>} All templates
   */
  getAllTemplates() {
    return localStorageService.getAllData(this.collectionName);
  }
  
  /**
   * Get templates by business type
   * @param {string} businessType - Business type to filter by
   * @returns {Promise<Array>} Filtered templates
   */
  getTemplatesByBusinessType(businessType) {
    return localStorageService.findData(
      this.collectionName,
      template => template.businessType === businessType
    );
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
  templateService: new TemplateService()
}; 