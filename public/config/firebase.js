// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
  getFirestore 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaZxZGHEA8ksXtFsM8PqKtDIx2Q68uwZA",
  authDomain: "qaaaa-448c6.firebaseapp.com",
  projectId: "qaaaa-448c6",
  storageBucket: "qaaaa-448c6.firebasestorage.app",
  messagingSenderId: "518781259229",
  appId: "1:518781259229:web:30604a80d3d0a3c6b73a34"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const firebase = { auth: { GoogleAuthProvider } };

// Export everything needed
export { 
  firebase, 
  auth, 
  db, 
  GoogleAuthProvider, 
  signInWithPopup 
}; 