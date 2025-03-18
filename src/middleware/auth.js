const { auth, db } = require('../config/firebase');

// Protect routes
exports.protect = async (req, res, next) => {
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
    return res.status(401).json({ 
      success: false, 
      error: 'Not authorized to access this route' 
    });
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
      return res.status(401).json({
        success: false,
        error: 'Your session has expired. Please login again'
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      error: 'Not authorized to access this route' 
    });
  }
}; 