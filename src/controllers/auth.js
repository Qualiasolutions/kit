const { auth, db } = require('../config/firebase');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('Register attempt:', { name, email });

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    // Email validation regex
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email',
      });
    }

    // Create user with Firebase
    try {
      // Create the user account
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Update user profile with name
      await user.updateProfile({
        displayName: name
      });
      
      // Store additional user data in Firestore
      await db.collection('users').doc(user.uid).set({
        name,
        email,
        createdAt: new Date()
      });
      
      console.log('User created successfully:', user.uid);
      
      // Generate token
      const token = await user.getIdToken();
      
      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.uid,
          name: user.displayName || name,
          email: user.email
        }
      });
    } catch (firebaseError) {
      console.error('Firebase error:', firebaseError);
      
      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/email-already-in-use') {
        return res.status(400).json({
          success: false,
          error: 'User already exists'
        });
      }
      
      if (firebaseError.code === 'auth/network-request-failed') {
        return res.status(503).json({
          success: false,
          error: 'Network error. Please check your connection.'
        });
      }
      
      throw firebaseError;
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password',
      });
    }

    // Sign in with Firebase
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Get Firebase token
      const token = await user.getIdToken();
      
      res.status(200).json({
        success: true,
        token,
        user: {
          id: user.uid,
          name: user.displayName,
          email: user.email
        }
      });
    } catch (firebaseError) {
      console.error('Firebase login error:', firebaseError);
      
      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/user-not-found' || 
          firebaseError.code === 'auth/wrong-password') {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      if (firebaseError.code === 'auth/too-many-requests') {
        return res.status(429).json({
          success: false,
          error: 'Too many failed login attempts. Please try again later.'
        });
      }
      
      throw firebaseError;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // req.user comes from the auth middleware
    res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}; 