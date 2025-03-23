/**
 * Script to initialize local storage with necessary collections and documents
 */
const localStorageService = require('../services/localStorageService');
const { industries } = require('../utils/fallbackData');
const { templates } = require('../utils/fallbackData');

async function initializeLocalStorage() {
  try {
    console.log('🔧 Initializing local storage with default data...');
    
    // Add industries
    console.log('Adding industries...');
    for (const industry of industries) {
      const id = industry.name.toLowerCase().replace(/\s+/g, '-');
      await localStorageService.saveData('industries', id, industry);
    }
    console.log('✅ Industries added successfully');
    
    // Add templates
    console.log('Adding templates...');
    for (const template of templates) {
      await localStorageService.saveData('templates', template.id, template);
    }
    console.log('✅ Templates added successfully');
    
    // Add sample users if needed
    const users = await localStorageService.getAllData('users');
    if (!users || users.length === 0) {
      console.log('Adding sample users...');
      await localStorageService.saveData('users', 'admin', {
        id: 'admin',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log('✅ Sample users added successfully');
    } else {
      console.log('Users collection already has data, skipping sample users');
    }
    
    console.log('🎉 Local storage initialization complete!');
  } catch (error) {
    console.error('❌ Local storage initialization error:', error);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  initializeLocalStorage()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Initialization script failed:', err);
      process.exit(1);
    });
} else {
  // Export for use in other modules
  module.exports = { initializeLocalStorage };
} 