const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Industry = require('../models/Industry');
const { db } = require('../config/firebase');

// Load env vars
dotenv.config();

// Connect to DB with increased timeout
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Increased timeout to 30 seconds
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Connected');
    return true;
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    return false;
  }
};

// Industry data
const industries = [
  {
    name: 'Automotive',
    niches: [
      { name: 'Car Dealerships' },
      { name: 'Auto Repair Shops' },
      { name: 'Car Rentals' },
      { name: 'Car Washes' },
      { name: 'Auto Parts Retailers' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Beauty & Personal Care',
    niches: [
      { name: 'Nail Salons' },
      { name: 'Hair Salons' },
      { name: 'Spas & Wellness Centers' },
      { name: 'Barber Shops' },
      { name: 'Makeup Studios' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Food & Beverage',
    niches: [
      { name: 'Restaurants' },
      { name: 'Cafés' },
      { name: 'Fast Food Chains' },
      { name: 'Bakeries' },
      { name: 'Food Trucks' },
      { name: 'Catering Services' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Health & Fitness',
    niches: [
      { name: 'Fitness Trainers' },
      { name: 'Gyms & Fitness Centers' },
      { name: 'Yoga Studios' },
      { name: 'Personal Training' },
      { name: 'Nutritionists & Dietitians' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Real Estate',
    niches: [
      { name: 'Real Estate Agencies' },
      { name: 'Property Management' },
      { name: 'Home Stagers' },
      { name: 'Commercial Real Estate' },
      { name: 'Real Estate Investors' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Education',
    niches: [
      { name: 'Universities & Colleges' },
      { name: 'Online Courses' },
      { name: 'Tutoring Services' },
      { name: 'K-12 Schools' },
      { name: 'Educational Consultants' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Professional Services',
    niches: [
      { name: 'Legal Firms' },
      { name: 'Accounting Firms' },
      { name: 'Consulting Services' },
      { name: 'Marketing Agencies' },
      { name: 'IT & Tech Consulting' },
      { name: 'Other' }
    ]
  },
  {
    name: 'E-commerce & Online Retail',
    niches: [
      { name: 'Online Stores' },
      { name: 'Dropshipping Businesses' },
      { name: 'Subscription Boxes' },
      { name: 'Digital Products' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Travel & Hospitality',
    niches: [
      { name: 'Hotels & Resorts' },
      { name: 'Travel Agencies' },
      { name: 'Tour Operators' },
      { name: 'Bed and Breakfasts' },
      { name: 'Event Venues' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Entertainment & Events',
    niches: [
      { name: 'Event Planners' },
      { name: 'Wedding Planners' },
      { name: 'Concert Venues' },
      { name: 'Nightclubs' },
      { name: 'Theaters' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Home & Garden',
    niches: [
      { name: 'Interior Design Firms' },
      { name: 'Landscaping Services' },
      { name: 'Home Improvement Contractors' },
      { name: 'Cleaning Services' },
      { name: 'Gardening Centers' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Finance & Insurance',
    niches: [
      { name: 'Banks' },
      { name: 'Credit Unions' },
      { name: 'Insurance Agencies' },
      { name: 'Financial Advisors' },
      { name: 'Investment Firms' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Technology & Software',
    niches: [
      { name: 'SaaS Companies' },
      { name: 'App Developers' },
      { name: 'IT Solutions Providers' },
      { name: 'Digital Marketing Agencies' },
      { name: 'Cybersecurity Firms' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Retail',
    niches: [
      { name: 'Brick-and-Mortar Stores' },
      { name: 'Boutiques' },
      { name: 'Specialty Retailers' },
      { name: 'Supermarkets' },
      { name: 'Department Stores' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Nonprofit & Government',
    niches: [
      { name: 'NGOs' },
      { name: 'Government Agencies' },
      { name: 'Community Organizations' },
      { name: 'Public Services' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Healthcare',
    niches: [
      { name: 'Medical Practices' },
      { name: 'Dental Clinics' },
      { name: 'Hospitals' },
      { name: 'Pharmacies' },
      { name: 'Mental Health Services' },
      { name: 'Other' }
    ]
  },
  {
    name: 'Other',
    niches: [
      { name: 'Online Services' },
      { name: 'Freelancers' },
      { name: 'Influencers' },
      { name: 'Hobby-Based Businesses' },
      { name: 'Custom Niches' },
      { name: 'Other' }
    ]
  }
];

/**
 * Seed the database with initial data
 * @returns {Promise<Object>} Result of the seed operation
 */
const seed = async () => {
  try {
    console.log('🌱 Seeding database...');
    
    // Add template data
    await seedTemplates();
    
    console.log('✅ Database seeded successfully');
    return { success: true, message: 'Database seeded successfully' };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Seed templates collection
 * @returns {Promise<void>}
 */
const seedTemplates = async () => {
  try {
    console.log('Creating templates collection if it does not exist...');
    
    // Define templates to seed
    const templates = [
      {
        id: 'standard',
        name: 'Standard Post',
        description: 'Clean, professional layout for general content',
        platforms: ['instagram', 'facebook', 'twitter', 'linkedin'],
        imageUrl: '/img/templates/standard.jpg',
        createdAt: new Date()
      },
      {
        id: 'promotional',
        name: 'Promotional',
        description: 'Eye-catching design for sales and promotions',
        platforms: ['instagram', 'facebook', 'twitter', 'linkedin'],
        imageUrl: '/img/templates/promotional.jpg',
        createdAt: new Date()
      },
      {
        id: 'news',
        name: 'News Update',
        description: 'Formal layout for announcements and news',
        platforms: ['instagram', 'facebook', 'twitter', 'linkedin'],
        imageUrl: '/img/templates/news.jpg',
        createdAt: new Date()
      },
      {
        id: 'event',
        name: 'Event Promotion',
        description: 'Showcase upcoming events with style',
        platforms: ['instagram', 'facebook', 'twitter'],
        imageUrl: '/img/templates/event.jpg',
        createdAt: new Date()
      },
      {
        id: 'real_estate',
        name: 'Real Estate',
        description: 'Property showcase with details',
        platforms: ['instagram', 'facebook'],
        imageUrl: '/img/templates/standard.jpg',
        createdAt: new Date()
      },
      {
        id: 'food',
        name: 'Food & Restaurant',
        description: 'Highlight menu items and special offers',
        platforms: ['instagram', 'facebook'],
        imageUrl: '/img/templates/standard.jpg',
        createdAt: new Date()
      }
    ];
    
    // Add templates to Firestore one by one
    console.log(`Adding ${templates.length} templates...`);
    
    for (const template of templates) {
      try {
        await db.collection('templates').doc(template.id).set(template);
        console.log(`Template ${template.id} added successfully`);
      } catch (error) {
        console.error(`Error adding template ${template.id}:`, error);
      }
    }
    
    console.log('Templates added successfully');
  } catch (error) {
    console.error('Error in seedTemplates:', error);
    throw error;
  }
};

// Export the seed function to be called from API
exports.seed = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB. Seeding aborted.');
      return { success: false, error: 'Database connection failed' };
    }

    await Industry.deleteMany();
    await Industry.insertMany(industries);
    
    console.log('Data Imported Successfully');
    return { success: true, message: 'Data imported successfully' };
  } catch (err) {
    console.error(`Seed Error: ${err.message}`);
    return { success: false, error: err.message };
  } finally {
    // Only disconnect if this was called directly from CLI
    if (require.main === module) {
      mongoose.disconnect();
    }
  }
};

// Delete data from DB
const deleteData = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB. Delete operation aborted.');
      process.exit(1);
    }

    await Industry.deleteMany();
    
    console.log('Data Destroyed...');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Check if this file is being run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const interactive = args.includes('-i') || args.includes('--interactive');
  
  if (interactive) {
    console.log('Starting interactive seed...');
    seed()
      .then(result => {
        console.log(result.success ? '✅ Seed completed successfully' : '❌ Seed failed');
        if (!result.success) {
          console.error(result.error);
          process.exit(1);
        }
        process.exit(0);
      })
      .catch(err => {
        console.error('Fatal error during seed:', err);
        process.exit(1);
      });
  } else {
    console.log('Run with -i or --interactive flag for interactive mode');
  }
}

module.exports = { seed }; 