// Import our Express application
const app = require('./index.js');

// Export a function that Vercel can call
module.exports = (req, res) => {
  // This is needed for serverless functions
  return app(req, res);
}; 