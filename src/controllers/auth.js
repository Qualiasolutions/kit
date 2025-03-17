const User = require('../models/User');

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

    // Check if user already exists with timeout handling
    let userExists;
    try {
      // Set a longer timeout for this operation by using exec() with options
      // This creates a separate promise with its own timeout
      const findOnePromise = User.findOne({ email }).maxTimeMS(30000).exec();
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timed out after 30 seconds')), 30000)
      );
      
      // Race the database query against the timeout
      userExists = await Promise.race([findOnePromise, timeoutPromise]);
      
    } catch (dbError) {
      console.error('Error checking for existing user:', dbError);
      
      // Special handling for timeout errors
      if (dbError.message.includes('timed out')) {
        return res.status(503).json({
          success: false,
          error: 'Database operation timed out. Please try again later.',
        });
      }
      
      throw dbError; // Re-throw for general error handling
    }

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    // Create user with timeout handling
    let user;
    try {
      user = await Promise.race([
        User.create({
          name,
          email,
          password,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User creation timed out')), 30000)
        )
      ]);
    } catch (createError) {
      console.error('Error creating user:', createError);
      if (createError.message.includes('timed out')) {
        return res.status(503).json({
          success: false,
          error: 'User creation timed out. Please try again later.',
        });
      }
      throw createError;
    }

    console.log('User created successfully:', user._id);
    sendTokenResponse(user, 201, res);
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

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    sendTokenResponse(user, 200, res);
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
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
}; 