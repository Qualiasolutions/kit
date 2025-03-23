const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { auth } = require('../config/firebase');
const localStorageService = require('../services/localStorageService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Validate inputs
  if (!name || !email || !password) {
    return next(new ErrorResponse('Please provide name, email, and password', 400));
  }

  try {
    // Create user
    const user = await auth.createUser({
      email,
      password,
      name
    });

    // Create token
    const token = await auth.createToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    return next(new ErrorResponse(error.message, 400));
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  try {
    // Try to login
    const { user, token } = await auth.login(email, password);

    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    return next(new ErrorResponse('Invalid credentials', 401));
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // User is already available in req.user due to the auth middleware
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  try {
    // Update user in local storage
    const userData = await localStorageService.getData('users', req.user.id);
    
    if (!userData) {
      return next(new ErrorResponse('User not found', 404));
    }

    const updatedUser = {
      ...userData,
      ...fieldsToUpdate,
      updatedAt: new Date().toISOString()
    };

    await localStorageService.saveData('users', req.user.id, updatedUser);

    // Don't return the password
    const { password, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update details error:', error);
    return next(new ErrorResponse('Error updating details', 500));
  }
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current and new password', 400));
  }

  try {
    // Get current user with password
    const userData = await localStorageService.getData('users', req.user.id);
    
    if (!userData) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Check if current password matches
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, userData.password);

    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    userData.password = hashedPassword;
    userData.updatedAt = new Date().toISOString();

    await localStorageService.saveData('users', req.user.id, userData);

    // Create a new token
    const token = await auth.createToken(req.user.id);

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Update password error:', error);
    return next(new ErrorResponse('Error updating password', 500));
  }
});

// @desc    Verify token
// @route   POST /api/auth/verify-token
// @access  Public
exports.verifyToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new ErrorResponse('Please provide a token', 400));
  }

  try {
    // Verify token
    const decoded = await auth.verifyToken(token);
    
    // Get user info
    const user = await auth.getUser(decoded.id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      isValid: true,
      user
    });
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Return specific error for expired tokens
    if (error.name === 'TokenExpiredError') {
      return res.status(200).json({
        success: true,
        isValid: false,
        message: 'Token expired'
      });
    }
    
    return res.status(200).json({
      success: true,
      isValid: false,
      message: 'Invalid token'
    });
  }
});

// @desc    Google sign in
// @route   POST /api/auth/google
// @access  Public
exports.googleSignIn = asyncHandler(async (req, res, next) => {
  const { idToken, user: googleUser } = req.body;

  if (!idToken || !googleUser) {
    return next(new ErrorResponse('Please provide idToken and user data', 400));
  }

  try {
    // For now, we'll create a simplified version without actual Google verification
    
    // Check if user exists
    const existingUser = await auth.getUserByEmail(googleUser.email);
    
    let userId;
    
    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create a new user
      const newUser = await auth.createUser({
        email: googleUser.email,
        name: googleUser.displayName || googleUser.name || '',
        // Generate a random password for Google users
        password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
      });
      
      userId = newUser.id;
    }
    
    // Create token
    const token = await auth.createToken(userId);
    
    // Get user data
    const user = await auth.getUser(userId);
    
    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return next(new ErrorResponse('Google authentication failed', 401));
  }
}); 