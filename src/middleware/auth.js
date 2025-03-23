const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies the JWT token in the Authorization header
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.protect = (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication token is missing or invalid' 
      });
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication token is missing' 
      });
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add the user data to the request object
      req.user = decoded;
      
      // Continue to the protected route
      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid authentication token' 
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    return res.status(500).json({ 
      error: 'Server Error', 
      message: 'An error occurred during authentication' 
    });
  }
}; 