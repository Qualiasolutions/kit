const { auth, db } = require('../config/firebase');
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
    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    
    try {
      // Get user data from Firebase
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const userData = userDoc.data();
      
      // Set user data on request
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        name: userData?.name || decodedToken.name || ''
      };
    } catch (firebaseError) {
      console.warn('Firebase data fetch failed, using local fallback:', firebaseError.message);
      
      // Try to get user from local storage
      const localUser = await localStorageService.getData('users', decodedToken.uid);
      
      if (localUser) {
        req.user = {
          id: decodedToken.uid,
          email: decodedToken.email,
          name: localUser.name || decodedToken.name || ''
        };
      } else {
        // Create a basic user record if not found locally
        const newUser = {
          id: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || '',
          createdAt: new Date().toISOString()
        };
        
        await localStorageService.saveData('users', decodedToken.uid, newUser);
        req.user = {
          id: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || ''
        };
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