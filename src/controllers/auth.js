const { auth } = require('../config/firebase');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  console.log('Register attempt:', { name, email });

  // Validate inputs
  if (!name || !email || !password) {
    return next(new ErrorResponse('Please provide name, email and password', 400));
  }

  if (password.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters', 400));
  }

  // Email validation regex
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorResponse('Please provide a valid email', 400));
  }

  try {
    // Create user with our local auth service
    const user = await auth.createUser({
      email,
      password,
      name
    });
    
    console.log('User created successfully:', user.id);
    
    // Generate JWT token
    const token = await auth.createToken(user.id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.message === 'Email already in use') {
      return next(new ErrorResponse('User already exists', 400));
    }
    
    return next(new ErrorResponse(error.message, 500));
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
    // Login with our local auth service
    const { user, token } = await auth.login(email, password);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return next(new ErrorResponse('Invalid credentials', 401));
  }
});

// @desc    Verify a JWT token
// @route   POST /api/auth/verify-token
// @access  Public
exports.verifyToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body;
  
  if (!token) {
    return next(new ErrorResponse('Please provide a token', 400));
  }
  
  try {
    // Verify the token
    const decoded = await auth.verifyToken(token);
    
    // Get the user details
    const user = await auth.getUser(decoded.id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return next(new ErrorResponse('Invalid or expired token', 401));
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // req.user comes from the auth middleware
  res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// @desc    Process Google Sign In
// @route   POST /api/auth/google
// @access  Public
exports.googleSignIn = asyncHandler(async (req, res, next) => {
  const { idToken, user: googleUser } = req.body;
  
  if (!idToken || !googleUser) {
    return next(new ErrorResponse('Please provide both idToken and user data', 400));
  }
  
  try {
    // Check if user exists by email
    let user = await auth.getUserByEmail(googleUser.email);
    
    if (!user) {
      // Create a new user
      user = await auth.createUser({
        email: googleUser.email,
        name: googleUser.displayName || googleUser.name,
        // Generate a secure random password
        password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      });
    }
    
    // Create a token for the user
    const token = await auth.createToken(user.id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return next(new ErrorResponse('Google authentication failed', 401));
  }
}); 