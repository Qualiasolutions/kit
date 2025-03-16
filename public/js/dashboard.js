document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // DOM elements
  const userName = document.getElementById('user-name');
  const profileIncomplete = document.getElementById('profile-incomplete');
  const profileComplete = document.getElementById('profile-complete');
  const businessLogo = document.getElementById('business-logo');
  const businessNameDisplay = document.getElementById('business-name-display');
  const businessIndustryDisplay = document.getElementById('business-industry-display');
  const primaryColorBox = document.getElementById('primary-color-box');
  const secondaryColorBox = document.getElementById('secondary-color-box');
  const accentColorBox = document.getElementById('accent-color-box');
  const logoutLink = document.getElementById('logout-link');

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    userName.textContent = user.name;
  }

  // Load business profile
  loadProfile();

  // Logout event listener
  logoutLink.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = 'login.html';
  });

  // Load business profile
  async function loadProfile() {
    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 404) {
        // No profile found, show incomplete section
        profileIncomplete.style.display = 'block';
        profileComplete.style.display = 'none';
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        // Show profile section
        profileIncomplete.style.display = 'none';
        profileComplete.style.display = 'flex';
        
        // Update profile display
        updateProfileDisplay(data.data);
      } else {
        console.error('Error loading profile:', data.error);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // Update profile display
  function updateProfileDisplay(profile) {
    // Business name and industry
    businessNameDisplay.textContent = profile.businessName;
    businessIndustryDisplay.textContent = `${profile.industry} / ${profile.niche}`;
    
    // Logo
    if (profile.logo && profile.logo !== 'no-logo.png') {
      businessLogo.src = `/uploads/${profile.logo}`;
    }
    
    // Brand colors
    if (profile.brandColors) {
      primaryColorBox.style.backgroundColor = profile.brandColors.primary;
      secondaryColorBox.style.backgroundColor = profile.brandColors.secondary;
      accentColorBox.style.backgroundColor = profile.brandColors.accent;
    }
  }
}); 