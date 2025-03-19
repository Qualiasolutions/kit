/**
 * Fallback data to use when database is unavailable
 */

// Industry data
exports.industries = [
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
    name: 'Technology & Software',
    niches: [
      { name: 'SaaS Companies' },
      { name: 'App Developers' },
      { name: 'IT Solutions Providers' },
      { name: 'Digital Marketing Agencies' },
      { name: 'Cybersecurity Firms' },
      { name: 'Other' }
    ]
  }
];

// Template fallback data
exports.templates = [
  {
    id: 'standard',
    name: 'Standard Post',
    description: 'Clean, professional layout for general content',
    platforms: ['instagram', 'facebook', 'twitter', 'linkedin'],
    imageUrl: '/img/templates/standard.jpg'
  },
  {
    id: 'promotional',
    name: 'Promotional',
    description: 'Eye-catching design for sales and promotions',
    platforms: ['instagram', 'facebook', 'twitter', 'linkedin'],
    imageUrl: '/img/templates/promotional.jpg'
  },
  {
    id: 'news',
    name: 'News Update',
    description: 'Formal layout for announcements and news',
    platforms: ['instagram', 'facebook', 'twitter', 'linkedin'],
    imageUrl: '/img/templates/news.jpg'
  }
]; 