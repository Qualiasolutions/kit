const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Full error:', error);
    
    // Don't exit the process in production, just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    
    return null;
  }
};

module.exports = connectDB; 