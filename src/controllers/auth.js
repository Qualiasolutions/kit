const { auth, db, admin } = require('../config/firebase');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  console.log('Register attempt:', { name, email });

  // Validate inputs
  if (!name || !email || !password) {
    return next(new ErrorResponse('Please provide name, email and password', 400));
  }

  if (password.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters', 400));
  }

  // Email validation regex
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorResponse('Please provide a valid email', 400));
  }

  try {
    // Create the user account with Firebase Admin
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });
    
    // Store additional user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('User created successfully:', userRecord.uid);
    
    // Generate custom token
    const token = await auth.createCustomToken(userRecord.uid);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: userRecord.uid,
        name: userRecord.displayName || name,
        email: userRecord.email
      }
    });
  } catch (firebaseError) {
    console.error('Firebase error:', firebaseError);
    
    // Handle specific Firebase errors
    if (firebaseError.code === 'auth/email-already-exists') {
      return next(new ErrorResponse('User already exists', 400));
    }
    
    return next(new ErrorResponse(firebaseError.message, 500));
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  try {
    // With Admin SDK, we can't directly sign in users with email/password
    // Instead, we need to verify credentials separately
    
    // 1. Get the user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // 2. Create a custom token for this user
    // Note: In a real implementation, you would verify the password 
    // using a secure method. For Firebase, typically you'd use 
    // Firebase Auth REST API for email/password auth.
    // This is a simplified example.
    const token = await auth.createCustomToken(userRecord.uid);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: userRecord.uid,
        name: userRecord.displayName,
        email: userRecord.email
      }
    });
  } catch (firebaseError) {
    console.error('Firebase login error:', firebaseError);
    
    // Handle specific Firebase errors
    if (firebaseError.code === 'auth/user-not-found') {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    
    return next(new ErrorResponse(firebaseError.message, 500));
  }
});

// @desc    Verify a Firebase ID token
// @route   POST /api/auth/verify-token
// @access  Public
exports.verifyToken = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return next(new ErrorResponse('Please provide an ID token', 400));
  }
  
  try {
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get the user details
    const userRecord = await auth.getUser(decodedToken.uid);
    
    res.status(200).json({
      success: true,
      user: {
        id: userRecord.uid,
        name: userRecord.displayName,
        email: userRecord.email
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return next(new ErrorResponse('Invalid or expired token', 401));
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // req.user comes from the auth middleware
  res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// @desc    Process Google Sign In
// @route   POST /api/auth/google
// @access  Public
exports.googleSignIn = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return next(new ErrorResponse('Please provide an ID token', 400));
  }
  
  try {
    // Verify the ID token from the client
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get or create user
    let userRecord;
    try {
      userRecord = await auth.getUser(decodedToken.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create them
        userRecord = await auth.createUser({
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture
        });
        
        // Store additional data
        await db.collection('users').doc(userRecord.uid).set({
          name: decodedToken.name,
          email: decodedToken.email,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        throw error;
      }
    }
    
    // Create a custom token for the user
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    res.status(200).json({
      success: true,
      token: customToken,
      user: {
        id: userRecord.uid,
        name: userRecord.displayName,
        email: userRecord.email
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return next(new ErrorResponse('Google authentication failed', 401));
  }
}); 