// Entry point for Vercel serverless deployment
const server = require('./server');

// Firebase initialization removed
console.log('Starting server in serverless mode');

// Export the Express app as a serverless function
module.exports = server; 