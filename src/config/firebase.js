// Import Firebase Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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
    
    // Try to read from environment variable first
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', e);
      }
    } 
    
    // If not available from env, read from file
    if (!serviceAccount) {
      try {
        const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
          console.log('📄 Reading Firebase service account from file');
          serviceAccount = require(serviceAccountPath);
        } else {
          throw new Error('Service account file not found');
        }
      } catch (e) {
        console.error('Error reading service account file:', e);
      }
    }
    
    // If still not available, create from env vars
    if (!serviceAccount && process.env.FIREBASE_PROJECT_ID) {
      console.log('🔑 Creating Firebase service account from environment variables');
      serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || 'default-key-id',
        private_key: process.env.FIREBASE_PRIVATE_KEY ? 
                     process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : 
                     undefined,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };
    }
    
    if (!serviceAccount || !serviceAccount.private_key) {
      throw new Error('Firebase service account is not properly configured');
    }
    
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
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