const { createApi } = require('unsplash-js');
const fetch = require('node-fetch');

// Unsplash API configuration
let unsplash;
try {
  // Initialize Unsplash API client
  if (process.env.UNSPLASH_ACCESS_KEY) {
    console.log('Initializing Unsplash API with access key');
    unsplash = createApi({
      accessKey: process.env.UNSPLASH_ACCESS_KEY,
      fetch: fetch,
    });
  } else {
    console.warn('Warning: Unsplash API key not found in environment variables. Template functionality will be limited.');
    unsplash = null;
  }
} catch (error) {
  console.error('Error initializing Unsplash API:', error);
  unsplash = null;
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

// In-memory cache for templates to reduce API calls
const templateCache = {
  byCategory: {},
  byId: {}
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
 * Get templates by category
 * @param {string} categoryId - The template category ID
 * @param {number} count - Number of templates to return
 * @returns {Promise<Array>} - Array of template objects
 */
const getTemplatesByCategory = async (categoryId, count = 5) => {
  try {
    console.log(`Getting templates for category: ${categoryId}`);
    
    // Check if we have cached templates for this category
    if (templateCache.byCategory[categoryId] && templateCache.byCategory[categoryId].length >= count) {
      console.log(`Using cached templates for category: ${categoryId}`);
      return templateCache.byCategory[categoryId].slice(0, count);
    }

    // Verify category exists
    if (!templateCategories[categoryId]) {
      console.error(`Invalid template category: ${categoryId}`);
      // Return default category templates instead
      return getTemplatesByCategory('product-showcase', count);
    }

    // Check if we have the Unsplash API key and instance
    if (!process.env.UNSPLASH_ACCESS_KEY || !unsplash) {
      console.error('Unsplash API key is missing or initialization failed - using fallback templates');
      return getFallbackTemplates(categoryId, count);
    }

    try {
      // Get search queries for this category
      const { searchQueries, overlay } = templateCategories[categoryId];
      const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

      console.log(`Fetching Unsplash images for query: "${randomQuery}"`);

      // Search Unsplash for images
      const response = await unsplash.search.getPhotos({
        query: randomQuery,
        page: 1,
        perPage: count * 2, // Get more photos than needed to have variety
        orientation: 'landscape'
      });

      // Check if Unsplash request was successful
      if (!response || !response.response || !response.response.results || response.response.results.length === 0) {
        console.warn(`Unsplash API request failed for query '${randomQuery}' - using fallback templates`);
        return getFallbackTemplates(categoryId, count);
      }

      console.log(`Successfully received ${response.response.results.length} images from Unsplash`);

      // Process results into templates
      const results = response.response.results;
      const templates = results.slice(0, count).map((result, index) => {
        const template = {
          id: `${categoryId}-${result.id}`,
          title: `${templateCategories[categoryId].name} Template ${index + 1}`,
          category: categoryId,
          imageUrl: result.urls.regular,
          imageThumbUrl: result.urls.thumb,
          imageAuthor: result.user.name,
          imageAuthorUrl: result.user.links.html,
          overlay: overlay
        };

        // Cache template by ID
        templateCache.byId[template.id] = template;
        return template;
      });

      // Cache templates for this category
      templateCache.byCategory[categoryId] = templates;

      return templates;
    } catch (apiError) {
      console.error(`Unsplash API error for category '${categoryId}':`, apiError);
      // Return fallback templates when Unsplash API fails
      return getFallbackTemplates(categoryId, count);
    }
  } catch (error) {
    console.error(`Error fetching templates for category '${categoryId}':`, error);
    // Return fallback templates when any error occurs
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
  console.log(`Generating ${count} fallback templates for category: ${categoryId}`);
  
  const category = templateCategories[categoryId];
  if (!category) {
    return [];
  }
  
  // Create multiple fallback templates for the category
  const templates = Array(count).fill().map((_, i) => ({
    id: `${categoryId}-fallback-${i}`,
    title: `${category.name} Template ${i + 1}`,
    category: categoryId,
    imageUrl: `https://source.unsplash.com/random/800x600/?${encodeURIComponent(category.searchQueries[0])}`,
    imageThumbUrl: `https://source.unsplash.com/random/400x300/?${encodeURIComponent(category.searchQueries[0])}`,
    imageAuthor: 'Unsplash',
    imageAuthorUrl: 'https://unsplash.com',
    overlay: category.overlay
  }));
  
  // Cache templates
  templateCache.byCategory[categoryId] = templates;
  templates.forEach(template => {
    templateCache.byId[template.id] = template;
  });
  
  return templates;
};

/**
 * Fetch a specific template by its ID
 * @param {string} templateId - The template ID from Unsplash
 * @returns {Promise<Object>} - Template metadata
 */
const getTemplateById = async (templateId) => {
  try {
    // Check if we have this template cached
    if (templateCache.byId[templateId]) {
      return templateCache.byId[templateId];
    }
    
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
    
    const template = {
      id: photo.id,
      categoryId: matchedCategory.id,
      categoryName: matchedCategory.name,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.small,
      authorName: photo.user.name,
      authorUrl: photo.user.links.html,
      overlay: matchedCategory.overlay,
      downloadUrl: photo.links.download,
      attribution: `Photo by ${photo.user.name} on Unsplash`
    };
    
    // Cache the template
    templateCache.byId[templateId] = template;
    
    return template;
  } catch (error) {
    console.error('Error fetching template by ID:', error);
    
    // Return a generic fallback template
    const fallbackCategoryId = 'product-showcase';
    const category = templateCategories[fallbackCategoryId];
    
    return {
      id: templateId,
      categoryId: fallbackCategoryId,
      categoryName: category.name,
      url: `https://via.placeholder.com/800x600?text=Template+Not+Found`,
      thumbnailUrl: `https://via.placeholder.com/400x300?text=Template+Not+Found`,
      authorName: 'OmuMediaKit',
      authorUrl: '#',
      overlay: category.overlay,
      downloadUrl: null,
      attribution: 'Default template'
    };
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
    const cacheKey = `search-${keyword}-${page}-${perPage}`;
    
    // Check if we have cached results
    if (templateCache.byId[cacheKey]) {
      return templateCache.byId[cacheKey];
    }
    
    const result = await unsplash.search.getPhotos({
      query: keyword,
      page,
      perPage
    });
    
    if (result.errors) {
      throw new Error(`Unsplash API error: ${result.errors[0]}`);
    }
    
    // Process results
    const templates = result.response.results.map(photo => {
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
        downloadUrl: photo.links.download,
        attribution: `Photo by ${photo.user.name} on Unsplash`
      };
    });
    
    const searchResults = {
      results: templates,
      total: result.response.total,
      total_pages: result.response.total_pages
    };
    
    // Cache the search results
    templateCache.byId[cacheKey] = searchResults;
    
    // Also cache individual templates
    templates.forEach(template => {
      templateCache.byId[template.id] = template;
    });
    
    return searchResults;
  } catch (error) {
    console.error('Error searching templates:', error);
    
    // Return fallback search results
    return {
      results: getFallbackTemplates('product-showcase', perPage),
      total: perPage,
      total_pages: 1
    };
  }
};

module.exports = {
  getTemplateCategories,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates
}; 