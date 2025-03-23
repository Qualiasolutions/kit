const { createApi } = require('unsplash-js');
const fetch = require('node-fetch');

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
 * Fetch template images for a specific category
 * @param {string} categoryId - The template category ID
 * @param {number} count - Number of templates to fetch (default: 5)
 * @returns {Promise<Array>} - Array of template images with metadata
 */
const getTemplatesByCategory = async (categoryId, count = 5) => {
  try {
    // Check if we have cached results
    if (templateCache.byCategory[categoryId]) {
      console.log(`Using cached templates for category: ${categoryId}`);
      return templateCache.byCategory[categoryId];
    }
    
    const category = templateCategories[categoryId];
    
    if (!category) {
      throw new Error(`Template category '${categoryId}' not found`);
    }
    
    // Pick a random search query from the category
    const searchQuery = category.searchQueries[Math.floor(Math.random() * category.searchQueries.length)];
    
    console.log(`Fetching Unsplash images for query: ${searchQuery}`);
    
    // Fetch images from Unsplash
    const result = await unsplash.search.getPhotos({
      query: searchQuery,
      orientation: 'landscape',
      perPage: count
    });
    
    if (result.errors) {
      console.error(`Unsplash API error: ${result.errors[0]}`);
      return getFallbackTemplates(categoryId, count);
    }
    
    // Check if we received a rate limiting error
    if (result.type === 'error') {
      if (result.status === 403) {
        console.error('Unsplash API rate limit exceeded. Using fallback templates.');
        return getFallbackTemplates(categoryId, count);
      }
      
      console.error(`Unsplash API error: ${JSON.stringify(result)}`);
      return getFallbackTemplates(categoryId, count);
    }
    
    // Process and return template data
    const templates = result.response.results.map(photo => ({
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
    
    // Cache the results
    templateCache.byCategory[categoryId] = templates;
    
    // Also cache individual templates by ID
    templates.forEach(template => {
      templateCache.byId[template.id] = template;
    });
    
    return templates;
  } catch (error) {
    console.error('Error fetching templates from Unsplash:', error);
    
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
  
  // Create multiple fallback templates for the category
  return Array(count).fill().map((_, i) => ({
    id: `${categoryId}-fallback-${i}`,
    categoryId: categoryId,
    categoryName: category.name,
    // Use placeholder images that are publicly available
    url: `https://via.placeholder.com/800x600?text=${category.name.replace(/\s+/g, '+')}`,
    thumbnailUrl: `https://via.placeholder.com/400x300?text=${category.name.replace(/\s+/g, '+')}`,
    authorName: 'OmuMediaKit',
    authorUrl: '#',
    overlay: category.overlay,
    downloadUrl: null,
    attribution: 'Default template'
  }));
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