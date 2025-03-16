const express = require('express');
const { 
  extractColorsFromLogo, 
  updateBrandColors, 
  updateBusinessVoice 
} = require('../controllers/branding');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

const router = express.Router();

router.post('/extract-colors', protect, upload.single('logo'), extractColorsFromLogo);
router.put('/colors', protect, updateBrandColors);
router.put('/voice', protect, updateBusinessVoice);

module.exports = router; 