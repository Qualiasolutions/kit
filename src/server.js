const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { admin, db } = require('./config/firebase');
const { seed } = require('./utils/seedData');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// Firebase authentication state
let isFirebaseInitialized = false;
let firebaseError = null;

// Ensure Firebase is initialized
const ensureFirebaseInitialized = async () => {
  if (isFirebaseInitialized) return true;

  try {
    // Test Firebase connection by making a simple query
    await db.collection('health').doc('status').get();
    isFirebaseInitialized = true;
    firebaseError = null;
    console.log('Firebase connection successful');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    firebaseError = error;
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
app.use('/public/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Middleware to ensure Firebase is initialized for API routes
app.use('/api', async (req, res, next) => {
  // Skip Firebase check for certain endpoints that don't need Firebase
  const skipFirebaseEndpoints = ['/api/health'];
  if (skipFirebaseEndpoints.includes(req.path)) {
    return next();
  }

  const firebaseSuccess = await ensureFirebaseInitialized();
  if (!firebaseSuccess) {
    console.error('Unable to connect to Firebase for API request:', req.path);
    return res.status(500).json({
      success: false,
      error: 'Firebase connection failed. Please try again later.',
      details: firebaseError ? firebaseError.message : 'Unknown error'
    });
  }
  next();
});

// Add middleware for handling Firebase errors
app.use((req, res, next) => {
  req.firebase = {
    initialized: !(!db || !admin),
    error: global.firebaseInitError
  };
  next();
});

// Health check endpoint that includes Firebase status
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    firebase: {
      initialized: req.firebase.initialized,
      error: req.firebase.error ? req.firebase.error.message : null
    },
    environment: process.env.NODE_ENV
  });
});

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/branding', require('./routes/branding'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/media', require('./routes/media'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai-posts', require('./routes/aiPosts'));

// Default route
app.get('/', (req, res) => {
  res.send('OmuMediaKit API is running');
});

// Seed database endpoint (admin only)
app.get('/api/seed', async (req, res) => {
  try {
    const firebaseSuccess = await ensureFirebaseInitialized();
    if (!firebaseSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Firebase connection failed. Cannot seed database.',
        details: firebaseError ? firebaseError.message : 'Unknown error'
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