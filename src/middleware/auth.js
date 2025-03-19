const { auth } = require('../config/firebase');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');
const localStorageService = require('../services/localStorageService');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify JWT token
    const decodedToken = await auth.verifyToken(token);
    
    try {
      // Get user data
      const user = await auth.getUser(decodedToken.id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Set user data on request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name
      };
    } catch (error) {
      console.warn('User data fetch failed, creating from token data:', error.message);
      
      // Create a basic user record from token if user is not found
      req.user = {
        id: decodedToken.id,
        email: decodedToken.email,
        name: decodedToken.name || ''
      };
      
      // Try to save user to local storage
      try {
        await localStorageService.saveData('users', decodedToken.id, {
          ...req.user,
          createdAt: new Date().toISOString()
        });
      } catch (saveError) {
        console.error('Failed to save user to local storage:', saveError);
      }
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    
    // Development mode fallback - ONLY FOR DEVELOPMENT
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using development fallback authentication');
      
      // Set a mock user for development
      req.user = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User'
      };
      
      return next();
    }
    
    // Handle token expired error
    if (err.code === 'auth/id-token-expired') {
      return next(new ErrorResponse('Your session has expired. Please login again', 401));
    }
    
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
}); 