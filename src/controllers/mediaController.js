const { cloudinary, removeBackground } = require('../config/cloudinary');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Upload image to Cloudinary
// @route   POST /api/media/upload
// @access  Private
exports.uploadImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  res.status(200).json({
    success: true,
    data: {
      url: req.file.path,
      public_id: req.file.filename,
      format: req.file.format
    }
  });
});

// @desc    Remove background from image
// @route   POST /api/media/remove-background/:publicId
// @access  Private
exports.removeImageBackground = asyncHandler(async (req, res, next) => {
  const { publicId } = req.params;

  if (!publicId) {
    return next(new ErrorResponse('Please provide an image public ID', 400));
  }

  try {
    const result = await removeBackground(publicId);
    
    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format
      }
    });
  } catch (error) {
    console.error('Background removal error:', error);
    return next(new ErrorResponse('Failed to remove background', 500));
  }
});

// @desc    Delete image from Cloudinary
// @route   DELETE /api/media/:publicId
// @access  Private
exports.deleteImage = asyncHandler(async (req, res, next) => {
  const { publicId } = req.params;

  if (!publicId) {
    return next(new ErrorResponse('Please provide an image public ID', 400));
  }

  const result = await cloudinary.uploader.destroy(publicId);

  if (result.result !== 'ok') {
    return next(new ErrorResponse('Error deleting image', 500));
  }

  res.status(200).json({
    success: true,
    data: {}
  });
}); 