const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const aiPostController = require('../controllers/aiPostController');
const templateController = require('../controllers/templateController');
const auth = require('../middleware/auth');

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/user', auth, authController.getUser);

// AI Post Generation routes
router.post('/generate-post', auth, aiPostController.generatePost);
router.post('/generate-hashtags', auth, aiPostController.generateHashtags);

// Template routes
router.get('/templates/categories', templateController.getTemplateCategories);
router.get('/templates/category/:categoryId', templateController.getTemplatesByCategory);
router.get('/templates/search', templateController.searchTemplates);
router.get('/templates/:templateId', templateController.getTemplateById);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

module.exports = router; 