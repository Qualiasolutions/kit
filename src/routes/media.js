const express = require('express');
const { uploadImage, deleteImage } = require('../controllers/mediaController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.post('/upload', upload.single('image'), uploadImage);
router.delete('/:publicId', deleteImage);

module.exports = router; 