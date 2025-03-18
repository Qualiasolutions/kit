const { auth, db } = require('../config/firebase');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');

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
    
    // Get user data
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    // Set user data on request
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      name: userData?.name || decodedToken.name || ''
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    
    // Handle token expired error
    if (err.code === 'auth/id-token-expired') {
      return next(new ErrorResponse('Your session has expired. Please login again', 401));
    }
    
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
}); 