document.addEventListener('DOMContentLoaded', async function() {
  const registerForm = document.getElementById('register-form');
  const alertContainer = document.getElementById('alert-container');
  
  // Import Firebase modules
  let auth, firebase, GoogleAuthProvider, signInWithPopup;
  try {
    const module = await import('../config/firebase.js');
    auth = module.auth;
    firebase = module.firebase;
    GoogleAuthProvider = module.GoogleAuthProvider;
    signInWithPopup = module.signInWithPopup;
  } catch (error) {
    console.error('Error loading Firebase modules:', error);
  }
  
  // Add Google signup button if it exists
  const googleBtn = document.getElementById('google-signup-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', handleGoogleSignUp);
  }
  
  // API base URL - change this to your deployed API URL when needed
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '' // Empty for local development (relative path)
    : 'https://kit-lime.vercel.app'; // Updated with actual deployed URL
  
  // Function to handle Google Sign Up
  async function handleGoogleSignUp() {
    try {
      // Create Google auth provider
      const provider = new GoogleAuthProvider();
      
      // Trigger Google sign-in popup
      const result = await signInWithPopup(auth, provider);
      
      // Get user from result
      const user = result.user;
      
      // Get ID token for server auth
      const token = await user.getIdToken();
      
      // Send token to backend to verify and create a session
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken: token })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Store user info and token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Show success message and redirect to profile setup
        showAlert('Registration with Google successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'profile-setup.html';
        }, 1500);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      showAlert('Google sign-up failed. Please try again.', 'danger');
    }
  }
  
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
      showAlert('Passwords do not match', 'danger');
      return;
    }
    
    try {
      // LOCAL STORAGE MODE - Bypass server registration
      // Check if demo mode enabled
      const devMode = true; // Set to true to enable demo mode, false to use actual API

      if (devMode) {
        // Special handling for admin registration
        if (email === 'admin@admin.com') {
          // Create admin user data
          const adminUser = {
            id: 'admin-user',
            name: name,
            email: 'admin@admin.com',
            role: 'admin'
          };
          
          // Create mock token
          const mockToken = 'admin-token-' + Math.random().toString(36).substring(2);
          
          // Save user and token to localStorage
          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(adminUser));
          localStorage.setItem('devMode', 'true');
          
          // Create mock business profile data for admin
          const mockBusinessProfile = {
            businessName: 'Admin Business',
            industry: 'Technology',
            niche: 'Software Development',
            brandColors: {
              primary: '#4361ee',
              secondary: '#3a0ca3',
              accent: '#f72585'
            },
            logo: 'logo-placeholder.png',
            businessVoice: 'Professional',
            targetAudience: ['Small Businesses', 'Startups', 'Tech Enthusiasts'],
            locationType: 'Global',
            location: 'Worldwide',
            website: 'https://adminbusiness.com',
            socialPlatforms: ['Instagram', 'Facebook', 'LinkedIn', 'Twitter/X']
          };
          
          // Save mock business profile
          localStorage.setItem('businessProfile', JSON.stringify(mockBusinessProfile));
          
          // Show success message and redirect
          showAlert('Admin registration successful! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
          return;
        }
        
        // Regular user registration
        // Create mock user data
        const mockUser = {
          id: 'local-' + Date.now(),
          name: name,
          email: email
        };
        
        // Create mock token
        const mockToken = 'dev-token-' + Math.random().toString(36).substring(2);
        
        // Save user and token to localStorage
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('devMode', 'true');
        
        // Show success message and redirect
        showAlert('Registration successful (Dev Mode)! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'profile-setup.html';
        }, 1500);
        return;
      }
      
      // PRODUCTION MODE - Only runs if devMode is false
      // Send registration request
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });
      
      // Check if the response is JSON before parsing
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text}`);
      }
      
      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Show success message and redirect
        showAlert('Registration successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'profile-setup.html';
        }, 1500);
      } else {
        showAlert(data.error || 'Registration failed', 'danger');
      }
    } catch (error) {
      showAlert('Server error. Please try again later.', 'danger');
      console.error(error);
    }
  });
  
  // Function to show alerts
  function showAlert(message, type) {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      const alert = document.querySelector('.alert');
      if (alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
  }
}); 