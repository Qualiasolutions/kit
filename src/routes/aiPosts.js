const express = require('express');
const { 
  getTemplates,
  detectBranding,
  generateContent,
  processImage,
  previewTemplate,
  createPost
} = require('../controllers/aiPostController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Template routes
router.get('/templates', getTemplates);

// Branding routes
router.get('/detect-branding', detectBranding);

// Content generation
router.post('/generate-content', generateContent);

// Image processing
router.post('/process-image', upload.single('image'), processImage);

// Template preview
router.post('/preview-template', previewTemplate);

// Post creation
router.post('/create', createPost);

module.exports = router; 