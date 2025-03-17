const express = require('express');
const { generateContent } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.post('/generate', generateContent);

module.exports = router; 