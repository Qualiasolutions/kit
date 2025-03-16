const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Industry = require('../models/Industry');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

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

// Import data into DB
const importData = async () => {
  try {
    await Industry.deleteMany();
    await Industry.insertMany(industries);
    
    console.log('Data Imported...');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Delete data from DB
const deleteData = async () => {
  try {
    await Industry.deleteMany();
    
    console.log('Data Destroyed...');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Check command line args
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please add proper command: -i (import) or -d (delete)');
  process.exit();
} 