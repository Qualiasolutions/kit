const express = require('express');
const router = express.Router();
const aiPostController = require('../controllers/aiPostController');
const auth = require('../middleware/auth');

// AI Content Generation Routes
router.post('/ai/generate-post', auth, aiPostController.generatePost);
router.post('/ai/generate-bio', auth, aiPostController.generateBio);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

module.exports = router; 