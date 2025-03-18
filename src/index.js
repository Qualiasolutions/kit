// Entry point for Vercel serverless deployment
const server = require('./server');

// Initialize firebase silently to avoid connection errors on cold start
try {
  const { admin } = require('./config/firebase');
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  // Continue anyway, as the server has proper error handling
}

// Export the Express app as a serverless function
module.exports = server; 