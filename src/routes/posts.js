const express = require('express');
const {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  getScheduledPosts,
  updatePostStatus
} = require('../controllers/postController');

const router = express.Router();

// Protect middleware
const { protect } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

// Routes for /api/posts
router.route('/')
  .get(getPosts)
  .post(createPost);

// Route for scheduled posts
router.route('/scheduled')
  .get(getScheduledPosts);

// Routes for specific post
router.route('/:id')
  .get(getPost)
  .put(updatePost)
  .delete(deletePost);

// Route for updating post status
router.route('/:id/status')
  .put(updatePostStatus);

module.exports = router; 