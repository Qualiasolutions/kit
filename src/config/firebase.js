// Local Authentication and Storage Service
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const localStorageService = require('../services/localStorageService');

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || '
JWT_SECRET=';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Authentication service
const auth = {
  /**
   * Create a new user
   * @param {Object} userData - User data including email, password, name
   * @returns {Promise<Object>} Created user data
   */
  async createUser(userData) {
    // Check if user already exists
    const existingUsers = await localStorageService.findData('users', 
      user => user.email === userData.email);
    
    if (existingUsers.length > 0) {
      throw new Error('User already exists with that email');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create user ID
    const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create user object
    const newUser = {
      id: uid,
      email: userData.email,
      name: userData.name || '',
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      role: userData.role || 'user'
    };
    
    // Save to local storage
    await localStorageService.saveData('users', uid, newUser);
    
    // Don't return the password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },
  
  /**
   * Login user with email/password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and token
   */
  async login(email, password) {
    // Find user by email
    const users = await localStorageService.findData('users', user => user.email === email);
    
    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const user = users[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    
    // Create token
    const token = await this.createToken(user.id);
    
    // Don't return the password
    const { password: pass, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token
    };
  },
  
  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUser(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const user = await localStorageService.getData('users', userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Don't return the password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  /**
   * Create a JWT token for authentication
   * @param {string} uid - User ID
   * @returns {Promise<string>} JWT token
   */
  async createToken(uid) {
    const user = await this.getUser(uid);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );
  },
  
  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token payload
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        error.code = 'auth/id-token-expired';
      }
      throw error;
    }
  }
};

// Database service
const db = {
  /**
   * Get a collection reference
   * @param {string} collectionName - Collection name
   * @returns {Object} Collection methods
   */
  collection(collectionName) {
    return {
      /**
       * Get a document reference
       * @param {string} id - Document ID
       * @returns {Object} Document methods
       */
      doc(id) {
        return {
          /**
           * Set document data
           * @param {Object} data - Document data
           * @returns {Promise<Object>} Saved data
           */
          async set(data) {
            return await localStorageService.saveData(collectionName, id, data);
          },
          
          /**
           * Get document data
           * @returns {Promise<Object>} Document data wrapper
           */
          async get() {
            const data = await localStorageService.getData(collectionName, id);
            
            return {
              exists: data !== null,
              data: () => data
            };
          },
          
          /**
           * Update document data
           * @param {Object} data - Document data to update
           * @returns {Promise<Object>} Updated data
           */
          async update(data) {
            const existingData = await localStorageService.getData(collectionName, id);
            
            if (!existingData) {
              throw new Error('Document does not exist');
            }
            
            const updatedData = {
              ...existingData,
              ...data,
              updatedAt: new Date().toISOString()
            };
            
            return await localStorageService.saveData(collectionName, id, updatedData);
          },
          
          /**
           * Delete document
           * @returns {Promise<boolean>} Success status
           */
          async delete() {
            return await localStorageService.deleteData(collectionName, id);
          }
        };
      },
      
      /**
       * Get all documents from collection
       * @returns {Promise<Array>} Array of documents
       */
      async get() {
        const data = await localStorageService.getAllData(collectionName);
        
        return {
          empty: data.length === 0,
          size: data.length,
          docs: data.map(doc => ({
            id: doc.id,
            data: () => doc,
            exists: true
          })),
          forEach(callback) {
            this.docs.forEach(callback);
          }
        };
      },
      
      /**
       * Add a new document with auto-generated ID
       * @param {Object} data - Document data
       * @returns {Promise<Object>} Added document reference
       */
      async add(data) {
        const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await localStorageService.saveData(collectionName, id, {
          ...data,
          id,
          createdAt: new Date().toISOString()
        });
        
        return this.doc(id);
      }
    };
  }
};

module.exports = { 
  auth, 
  db
}; 