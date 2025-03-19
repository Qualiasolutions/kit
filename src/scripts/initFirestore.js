/**
 * Script to initialize Firestore with necessary collections and documents
 */
const { db } = require('../config/firebase');
const { industries } = require('../utils/fallbackData');
const { templates } = require('../utils/fallbackData');

async function initializeFirestore() {
  try {
    console.log('🔥 Initializing Firestore with default data...');
    
    // Add industries
    console.log('Adding industries...');
    for (const industry of industries) {
      await db.collection('industries').doc(industry.name.toLowerCase().replace(/\s+/g, '-')).set(industry);
    }
    console.log('✅ Industries added successfully');
    
    // Add templates
    console.log('Adding templates...');
    for (const template of templates) {
      await db.collection('templates').doc(template.id).set(template);
    }
    console.log('✅ Templates added successfully');
    
    // Add sample users if needed
    const usersCollection = await db.collection('users').get();
    if (usersCollection.empty) {
      console.log('Adding sample users...');
      await db.collection('users').doc('admin').set({
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log('✅ Sample users added successfully');
    } else {
      console.log('Users collection already has data, skipping sample users');
    }
    
    console.log('🎉 Firestore initialization complete!');
  } catch (error) {
    console.error('❌ Firestore initialization error:', error);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  initializeFirestore()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Initialization script failed:', err);
      process.exit(1);
    });
} else {
  // Export for use in other modules
  module.exports = { initializeFirestore };
}