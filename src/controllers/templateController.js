const path = require('path');
const fs = require('fs');

/**
 * Get all available post templates
 * @route   GET /api/templates
 * @access  Public
 */
exports.getTemplates = async (req, res) => {
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
exports.getTemplate = async (req, res) => {
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