/**
 * Application configuration
 */

module.exports = {
  // Server config
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  
  // JWT config
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-for-development',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // OpenAI config
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  },
  
  // Check if required environment variables are set
  checkEnv: function() {
    const requiredVars = ['JWT_SECRET', 'OPENAI_API_KEY'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.warn(`WARNING: Missing required environment variables: ${missing.join(', ')}`);
      
      if (this.env === 'production') {
        console.error('ERROR: Missing required environment variables in production');
        process.exit(1);
      }
    }
  }
}; 