const fs = require('fs');
const path = require('path');

/**
 * Service to handle local file-based storage when Firebase/Firestore is unavailable
 */
class LocalStorageService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }
  
  /**
   * Save data to local JSON file
   * @param {string} collection - Collection name (like Firestore collection)
   * @param {string} id - Document ID
   * @param {Object} data - Data to save
   * @returns {Promise<Object>} Saved data
   */
  async saveData(collection, id, data) {
    try {
      // Ensure collection directory exists
      const collectionDir = path.join(this.dataDir, collection);
      if (!fs.existsSync(collectionDir)) {
        fs.mkdirSync(collectionDir, { recursive: true });
      }
      
      // Add metadata
      const saveData = {
        ...data,
        id,
        updatedAt: new Date().toISOString()
      };
      
      // Write to file
      const filePath = path.join(collectionDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2));
      
      return saveData;
    } catch (error) {
      console.error('Error saving data to local storage:', error);
      throw error;
    }
  }
  
  /**
   * Get data from local JSON file
   * @param {string} collection - Collection name
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>} Retrieved data or null if not found
   */
  async getData(collection, id) {
    try {
      const filePath = path.join(this.dataDir, collection, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting data from local storage:', error);
      return null;
    }
  }
  
  /**
   * Get all documents from a collection
   * @param {string} collection - Collection name
   * @returns {Promise<Array>} Array of documents
   */
  async getAllData(collection) {
    try {
      const collectionDir = path.join(this.dataDir, collection);
      
      if (!fs.existsSync(collectionDir)) {
        return [];
      }
      
      const files = fs.readdirSync(collectionDir);
      const data = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(collectionDir, file);
          const fileData = fs.readFileSync(filePath, 'utf8');
          data.push(JSON.parse(fileData));
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error getting all data from local storage:', error);
      return [];
    }
  }
  
  /**
   * Delete data from local storage
   * @param {string} collection - Collection name
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteData(collection, id) {
    try {
      const filePath = path.join(this.dataDir, collection, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting data from local storage:', error);
      return false;
    }
  }
  
  /**
   * Find documents by query
   * @param {string} collection - Collection name
   * @param {Function} filterFn - Filter function
   * @returns {Promise<Array>} Filtered documents
   */
  async findData(collection, filterFn) {
    try {
      const allData = await this.getAllData(collection);
      return allData.filter(filterFn);
    } catch (error) {
      console.error('Error finding data in local storage:', error);
      return [];
    }
  }
}

module.exports = new LocalStorageService(); 