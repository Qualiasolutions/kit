// Vercel Serverless Function entry point
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('../src/config/db');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// Connect to database with retry logic
const initDatabase = async () => {
  let retries = 5;
  let connected = false;
  
  while (retries > 0 && !connected) {
    try {
      console.log(`MongoDB connection attempt: ${6 - retries}/5`);
      await connectDB();
      connected = true;
      console.log('MongoDB connection successful');
    } catch (error) {
      console.error(`MongoDB connection failed (${retries} attempts left): ${error.message}`);
      retries--;
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!connected) {
    console.error('All MongoDB connection attempts failed');
  }
};

// Initialize database connection
initDatabase().catch(err => console.error('Database initialization error:', err));

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5000', 'https://kit-lime.vercel.app', 'https://omu-media-kit.vercel.app', 'https://omumediakit.vercel.app', 'https://*.vercel.app'],
  credentials: true
}));

// Set static folder
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../src/uploads')));

// Define routes
app.use('/api/auth', require('../src/routes/auth'));
app.use('/api/profile', require('../src/routes/profile'));
app.use('/api/branding', require('../src/routes/branding'));

// Default route
app.get('/', (req, res) => {
  res.send('OmuMediaKit API is running');
});

// Seed database endpoint (admin only)
app.get('/api/seed', async (req, res) => {
  try {
    const secretKey = req.query.key;
    if (secretKey !== process.env.SEED_KEY && secretKey !== 'omu-secret-seed-key') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { seed } = require('../src/utils/seedData');
    const result = await seed();
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, '../public')));

  // Handle SPA routing - for any routes not caught by the express routes, serve the index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
  });
}

module.exports = app; 