const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

// Create storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'omumediakit',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Create Multer upload instance
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // limit to 5MB
  }
});

// Helper function for background removal
const removeBackground = async (publicId) => {
  try {
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      background_removal: 'cloudinary_ai'
    });
    
    return result;
  } catch (error) {
    console.error('Background removal error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  upload,
  removeBackground
}; 