/**
 * Application configuration
 */

require('dotenv').config();

// Environment configuration
const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-for-jwt',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
  },
  
  // Unsplash API configuration
  unsplash: {
    accessKey: process.env.UNSPLASH_ACCESS_KEY
  },
  
  // Development mode flag
  isDev: process.env.NODE_ENV !== 'production',
  
  // Default password for demo users
  demoUserPassword: process.env.DEMO_USER_PASSWORD || 'demo1234',
  
  // Check if required environment variables are set
  checkEnv: function() {
    const requiredVars = ['JWT_SECRET', 'OPENAI_API_KEY'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.warn(`WARNING: Missing required environment variables: ${missing.join(', ')}`);
      
      if (this.nodeEnv === 'production') {
        console.error('ERROR: Missing required environment variables in production');
        process.exit(1);
      }
    }
  }
};

module.exports = config; 