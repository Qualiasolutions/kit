const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/error');
const localStorageService = require('./services/localStorageService');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

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

// Ensure data directory exists for local storage
app.use(async (req, res, next) => {
  try {
    // Check if the data directory exists
    const dataDir = path.join(__dirname, '../data');
    const fs = require('fs');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    next();
  } catch (error) {
    console.error('Error ensuring data directory exists:', error);
    next();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    storage: 'local',
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
    
    // Simple seed function to create test data
    const seedData = async () => {
      try {
        // Create test admin user
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        const adminUser = {
          id: 'admin-user',
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        
        await localStorageService.saveData('users', adminUser.id, adminUser);
        
        // Create business profile for admin
        const adminProfile = {
          id: adminUser.id,
          userId: adminUser.id,
          businessName: 'Admin Business',
          industry: 'Technology',
          niche: 'Software Development',
          brandColors: {
            primary: '#4361ee',
            secondary: '#3a0ca3',
            accent: '#f72585'
          },
          logo: 'logo-placeholder.png',
          businessVoice: 'Professional',
          targetAudience: ['Small Businesses', 'Startups', 'Tech Enthusiasts'],
          locationType: 'Global',
          location: 'Worldwide',
          website: 'https://adminbusiness.com',
          socialPlatforms: ['Instagram', 'Facebook', 'LinkedIn', 'Twitter/X'],
          createdAt: new Date().toISOString()
        };
        
        await localStorageService.saveData('businessProfiles', adminProfile.id, adminProfile);
        
        // Create some sample posts
        const samplePosts = [
          {
            id: 'post_1',
            userId: adminUser.id,
            title: 'Grow Your Business With Social Media',
            content: 'Looking to take your business to the next level? Our social media strategies can help you connect with your audience and drive real results.',
            hashtags: ['#socialmedia', '#business', '#growth', '#marketing'],
            platform: 'Instagram',
            contentType: 'post',
            topic: 'Business Growth',
            tone: 'professional',
            isScheduled: false,
            status: 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'post_2',
            userId: adminUser.id,
            title: '5 Tips for Better Content',
            content: 'Want to create content that stands out? Follow these 5 proven tips to engage your audience and boost your social media presence.',
            hashtags: ['#contentcreation', '#socialmediatips', '#digitalmarketing'],
            platform: 'Facebook',
            contentType: 'carousel',
            topic: 'Content Creation',
            tone: 'friendly',
            isScheduled: true,
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'scheduled',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        for (const post of samplePosts) {
          await localStorageService.saveData('posts', post.id, post);
        }
        
        return { success: true, message: 'Database seeded successfully' };
      } catch (error) {
        console.error('Error seeding database:', error);
        return { success: false, error: error.message };
      }
    };
    
    const result = await seedData();
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