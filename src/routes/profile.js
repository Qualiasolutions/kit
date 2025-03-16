const express = require('express');
const { 
  getIndustries, 
  createProfile, 
  getProfile, 
  getSuggestedAudiences 
} = require('../controllers/profile');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

const router = express.Router();

router.get('/industries', getIndustries);
router.get('/target-audiences/:industry/:niche', protect, getSuggestedAudiences);
router.get('/', protect, getProfile);
router.post('/', protect, upload.single('logo'), createProfile);

module.exports = router; 