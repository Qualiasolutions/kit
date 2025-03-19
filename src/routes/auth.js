const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  verifyToken, 
  googleSignIn,
  updateDetails,
  updatePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-token', verifyToken);
router.post('/google', googleSignIn);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router; 