// Local auth service (Firebase replacement)
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const localStorageService = require('../services/localStorageService');
const { v4: uuidv4 } = require('uuid');

/**
 * Simple authentication service that replaces Firebase Auth
 * using local storage and JWT tokens
 */
class Auth {
  /**
   * Create a new user
   * @param {Object} userData - User data including email, password, name
   * @returns {Promise<Object>} Created user object
   */
  async createUser({ email, password, name }) {
    try {
      // Check if user already exists
      const existingUsers = await localStorageService.findData('users', 
        user => user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (existingUsers.length > 0) {
        throw new Error('Email already in use');
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Generate user ID
      const id = uuidv4();
      
      // Create user object
      const user = {
        id,
        email,
        name,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save user to local storage
      await localStorageService.saveData('users', id, user);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and token
   */
  async login(email, password) {
    try {
      // Find user by email
      const users = await localStorageService.findData('users', 
        user => user.email.toLowerCase() === email.toLowerCase()
      );
      
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
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }
  
  /**
   * Create a JWT token for a user
   * @param {string} userId - User ID
   * @returns {Promise<string>} JWT token
   */
  async createToken(userId) {
    try {
      const user = await localStorageService.getData('users', userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Create payload
      const payload = {
        id: user.id,
        email: user.email,
        name: user.name
      };
      
      // Sign token
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      return token;
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  }
  
  /**
   * Verify a JWT token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      console.error('Error verifying token:', error);
      throw error;
    }
  }
  
  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUser(userId) {
    try {
      const user = await localStorageService.getData('users', userId);
      
      if (!user) {
        return null;
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
  
  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User object
   */
  async getUserByEmail(email) {
    try {
      const users = await localStorageService.findData('users', 
        user => user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (users.length === 0) {
        return null;
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = users[0];
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }
}

// Export auth service
const auth = new Auth();

module.exports = {
  auth,
  admin: null, // Keep for compatibility
  db: null     // Keep for compatibility
}; 