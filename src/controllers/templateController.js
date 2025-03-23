const templateService = require('../services/templateService');

/**
 * Get all available post templates
 * @route   GET /api/templates
 * @access  Public
 */
const getTemplates = async (req, res) => {
  try {
    // Get a random category for initial templates
    const categories = templateService.getTemplateCategories();
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    // Fetch templates for the random category
    const templates = await templateService.getTemplatesByCategory(randomCategory.id);
    
    // Return the templates
    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Could not retrieve templates'
    });
  }
};

/**
 * Get a single template by ID
 * @route   GET /api/templates/:id
 * @access  Public
 */
const getTemplate = async (req, res) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template with ID ${req.params.id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: 'Could not retrieve template'
    });
  }
};

/**
 * Get all template categories
 * @route   GET /api/templates/categories
 * @access  Public
 */
const getTemplateCategories = async (req, res) => {
  try {
    // Get all template categories
    const categories = templateService.getTemplateCategories();
    
    // Return the categories
    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Error fetching template categories:', error);
    res.status(500).json({
      success: false,
      error: 'Could not retrieve template categories'
    });
  }
};

/**
 * Get templates by category
 * @route   GET /api/templates/category/:categoryId
 * @access  Public
 */
const getTemplatesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const count = parseInt(req.query.count) || 5;
    
    console.log(`Request for templates in category: ${categoryId}, count: ${count}`);
    
    // Validate category ID
    const categories = templateService.getTemplateCategories();
    const categoryExists = categories.some(category => category.id === categoryId);
    
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        error: `Category ID '${categoryId}' is not valid`
      });
    }
    
    // Get templates for the category
    const templates = await templateService.getTemplatesByCategory(categoryId, count);
    
    // Return the templates
    res.status(200).json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error(`Error fetching templates for category '${req.params.categoryId}':`, error);
    res.status(500).json({
      success: false,
      error: 'Could not retrieve templates for this category'
    });
  }
};

/**
 * Get template by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await templateService.getTemplateById(templateId);
    res.status(200).json({ success: true, template });
  } catch (error) {
    console.error('Error fetching template by ID:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template' });
  }
};

/**
 * Search templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchTemplates = async (req, res) => {
  try {
    const { query } = req.query;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage) : 10;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }
    
    const results = await templateService.searchTemplates(query, page, perPage);
    res.status(200).json({ success: true, ...results });
  } catch (error) {
    console.error('Error searching templates:', error);
    res.status(500).json({ success: false, error: 'Failed to search templates' });
  }
};

module.exports = {
  getTemplates,
  getTemplate,
  getTemplateCategories,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates
}; 