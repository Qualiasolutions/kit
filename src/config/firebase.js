// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Load service account
// For development, we can use process.env.GOOGLE_APPLICATION_CREDENTIALS
// or inline credentials if available
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Default to a local path if env var not available
    serviceAccount = require('../../firebase-service-account.json');
  }
} catch (error) {
  console.warn('⚠️ Firebase service account not found, using application default credentials');
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: serviceAccount 
    ? admin.credential.cert(serviceAccount)
    : admin.credential.applicationDefault(),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || 'qaaaa-448c6'}.firebaseio.com`
});

// Get auth and firestore
const auth = admin.auth();
const db = admin.firestore();

// For compatibility with the rest of the application
const firebase = { auth: { GoogleAuthProvider: 'google.com' } };
const GoogleAuthProvider = 'google.com';

module.exports = { admin, firebase, auth, db, GoogleAuthProvider }; 