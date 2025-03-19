const express = require('express');
const router = express.Router();
const { getTemplates, getTemplate } = require('../controllers/templateController');

// Routes for /api/templates
router.get('/', getTemplates);
router.get('/:id', getTemplate);

module.exports = router; 