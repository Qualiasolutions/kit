const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    // Try MONGODB_URI first (for Vercel), then MONGO_URI (for local dev)
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables. Please set MONGODB_URI or MONGO_URI.');
    }
    
    // Catch deprecation warnings
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 90000,
      connectTimeoutMS: 60000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      heartbeatFrequencyMS: 30000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Stack trace:', error.stack);
    
    // Don't exit the process in production, just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    
    return null;
  }
};

module.exports = connectDB; 