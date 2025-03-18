// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Check if we are in development mode
const isDev = process.env.NODE_ENV === 'development';

// Mock implementations for development
const mockAuth = {
  createUser: async (userData) => ({
    uid: `dev-${Date.now()}`,
    email: userData.email,
    displayName: userData.displayName
  }),
  getUserByEmail: async (email) => ({
    uid: `dev-${email.replace(/@/g, '-').replace(/\./g, '-')}`,
    email: email,
    displayName: email.split('@')[0]
  }),
  createCustomToken: async (uid) => `dev-token-${uid}`,
  verifyIdToken: async (token) => ({
    uid: token.replace('dev-token-', ''),
    email: 'dev@example.com',
    name: 'Development User'
  }),
  getUser: async (uid) => ({
    uid: uid,
    email: 'dev@example.com',
    displayName: 'Development User'
  })
};

const mockFirestore = {
  collection: (name) => ({
    doc: (id) => ({
      set: async (data) => console.log(`[DEV] Set ${name}/${id}:`, data),
      get: async () => ({
        exists: true,
        data: () => ({ id, ...data, createdAt: new Date() })
      })
    })
  })
};

let auth, db;

// Initialize Firebase based on environment
if (isDev) {
  console.log('🧪 Running in DEVELOPMENT mode with mock Firebase');
  auth = mockAuth;
  db = mockFirestore;
} else {
  // Production Firebase setup
  try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      // Default to a local path if env var not available
      serviceAccount = require('../../firebase-service-account.json');
    }
    
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || 'qaaaa-448c6'}.firebaseio.com`
    });
    
    // Get auth and firestore
    auth = admin.auth();
    db = admin.firestore();
    
    console.log('🔥 Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    // Fallback to mock implementation in case of error
    auth = mockAuth;
    db = mockFirestore;
  }
}

// For compatibility with the rest of the application
const firebase = { auth: { GoogleAuthProvider: 'google.com' } };
const GoogleAuthProvider = 'google.com';

module.exports = { admin, firebase, auth, db, GoogleAuthProvider }; 