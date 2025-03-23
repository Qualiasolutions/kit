const path = require('path');
const fs = require('fs');
const templateService = require('../services/templateService');

/**
 * Get all available post templates
 * @route   GET /api/templates
 * @access  Public
 */
const getTemplates = async (req, res) => {
  try {
    // Read templates from JSON file
    const templatesPath = path.join(__dirname, '../data/templates.json');
    const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
    
    // Filter templates by platform if specified
    const platform = req.query.platform;
    if (platform) {
      const filteredTemplates = templates.filter(template => 
        template.platform === 'all' || template.platform.includes(platform)
      );
      
      return res.status(200).json({
        success: true,
        count: filteredTemplates.length,
        data: filteredTemplates
      });
    }
    
    // Return all templates
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
    // Read templates from JSON file
    const templatesPath = path.join(__dirname, '../data/templates.json');
    const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
    
    // Find the template by ID
    const template = templates.find(t => t.id === req.params.id);
    
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
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTemplateCategories = async (req, res) => {
  try {
    const categories = templateService.getTemplateCategories();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching template categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template categories' });
  }
};

/**
 * Get templates by category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTemplatesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const count = req.query.count ? parseInt(req.query.count) : 6;
    
    const templates = await templateService.getTemplatesByCategory(categoryId, count);
    res.status(200).json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates by category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
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