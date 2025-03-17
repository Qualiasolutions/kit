// Import our Express application
const app = require('./index.js');

// Export a function that Vercel can call
module.exports = async (req, res) => {
  // Set a longer timeout for the request
  req.setTimeout && req.setTimeout(50000);
  res.setTimeout && res.setTimeout(50000);
  
  // Add request logging
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  try {
    // This is needed for serverless functions
    return await app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // If headers haven't been sent yet, send a 500 error
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error', 
        message: process.env.NODE_ENV === 'production' 
          ? 'Server error, please try again later' 
          : error.message 
      });
    }
  }
}; 