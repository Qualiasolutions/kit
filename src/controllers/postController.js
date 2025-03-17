const Post = require('../models/Post');
const BusinessProfile = require('../models/BusinessProfile');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = asyncHandler(async (req, res, next) => {
  // Add user to request body
  req.body.user = req.user.id;

  // Check if business profile exists
  const businessProfile = await BusinessProfile.findOne({ user: req.user.id });
  
  if (!businessProfile) {
    return next(new ErrorResponse('Please create a business profile first', 400));
  }

  // Add business profile to request
  req.body.businessProfile = businessProfile._id;

  // Create post
  const post = await Post.create(req.body);

  res.status(201).json({
    success: true,
    data: post
  });
});

// @desc    Get all posts for a user
// @route   GET /api/posts
// @access  Private
exports.getPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts
  });
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the post
  if (post.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to access this post`, 401));
  }

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the post
  if (post.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to update this post`, 401));
  }

  post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the post
  if (post.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to delete this post`, 401));
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get scheduled posts
// @route   GET /api/posts/scheduled
// @access  Private
exports.getScheduledPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find({ 
    user: req.user.id,
    status: 'scheduled',
    scheduledDate: { $gte: new Date() }
  }).sort({ scheduledDate: 1 });

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts
  });
});

// @desc    Update post status
// @route   PUT /api/posts/:id/status
// @access  Private
exports.updatePostStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status || !['draft', 'scheduled', 'published', 'archived'].includes(status)) {
    return next(new ErrorResponse('Please provide a valid status', 400));
  }

  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`Post not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the post
  if (post.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to update this post`, 401));
  }

  post = await Post.findByIdAndUpdate(
    req.params.id, 
    { status }, 
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: post
  });
}); 