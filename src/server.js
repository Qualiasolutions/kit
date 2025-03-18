const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const { seed } = require('./utils/seedData');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// Database connection state
let isConnected = false;
let connectionError = null;

// Connect to database - don't connect on module import, only when handler is called
const ensureDbConnected = async () => {
  if (isConnected) return true;

  try {
    const conn = await connectDB();
    if (conn) {
      isConnected = true;
      connectionError = null;
      return true;
    } else {
      connectionError = new Error('Failed to connect to MongoDB');
      return false;
    }
  } catch (error) {
    console.error('Database connection attempt failed:', error);
    connectionError = error;
    return false;
  }
};

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5000', 'https://kit-lime.vercel.app', 'https://omu-media-kit.vercel.app', 'https://omumediakit.vercel.app', 'https://*.vercel.app'],
  credentials: true
}));

// Set static folder
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to ensure DB is connected for API routes
app.use('/api', async (req, res, next) => {
  // Skip DB connection for certain endpoints that don't need DB
  const skipDbEndpoints = ['/api/health'];
  if (skipDbEndpoints.includes(req.path)) {
    return next();
  }

  const connSuccess = await ensureDbConnected();
  if (!connSuccess) {
    console.error('Unable to connect to database for API request:', req.path);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed. Please try again later.',
      details: connectionError ? connectionError.message : 'Unknown error'
    });
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    dbConnected: isConnected
  });
});

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/branding', require('./routes/branding'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/media', require('./routes/media'));
app.use('/api/ai', require('./routes/ai'));

// Default route
app.get('/', (req, res) => {
  res.send('OmuMediaKit API is running');
});

// Seed database endpoint (admin only)
app.get('/api/seed', async (req, res) => {
  try {
    const connSuccess = await ensureDbConnected();
    if (!connSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed. Cannot seed database.',
        details: connectionError ? connectionError.message : 'Unknown error'
      });
    }

    const secretKey = req.query.key;
    if (secretKey !== process.env.SEED_KEY && secretKey !== 'omu-secret-seed-key') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
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

// Error handler middleware
app.use(errorHandler);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, '../public')));

  // Handle SPA routing - for any routes not caught by the express routes, serve the index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
  });
}

// In local development environment, start the server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for serverless deployment
module.exports = app; 