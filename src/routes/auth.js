const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  verifyToken, 
  googleSignIn 
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-token', verifyToken);
router.post('/google', googleSignIn);
router.get('/me', protect, getMe);

module.exports = router; 