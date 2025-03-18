document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // API base URL - change this to your deployed API URL when needed
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '' // Empty for local development (relative path)
    : 'https://kit-lime.vercel.app'; // Updated with actual deployed URL

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

  // Check if we're in dev mode
  const devMode = localStorage.getItem('devMode') === 'true';

  // Load business profile
  loadProfile();

  // Logout event listener
  logoutLink.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('devMode');
    localStorage.removeItem('mockProfile');
    
    // Redirect to login page
    window.location.href = 'login.html';
  });

  // Load business profile
  async function loadProfile() {
    try {
      // Check if we're in development mode
      if (devMode) {
        // Check if we have a profile in localStorage
        const mockProfile = JSON.parse(localStorage.getItem('mockProfile'));
        
        if (!mockProfile) {
          // No profile found, show incomplete section
          profileIncomplete.style.display = 'block';
          profileComplete.style.display = 'none';
          return;
        }
        
        // Show profile section
        profileIncomplete.style.display = 'none';
        profileComplete.style.display = 'flex';
        
        // Update profile display
        updateProfileDisplay(mockProfile);
        return;
      }
      
      // If not in dev mode, fetch from server
      const response = await fetch(`${API_URL}/api/profile`, {
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
      if (devMode) {
        // For dev mode, we might have a data URL
        businessLogo.src = profile.logo;
      } else {
        businessLogo.src = `${API_URL}/uploads/${profile.logo}`;
      }
    }
    
    // Brand colors
    if (profile.brandColors) {
      primaryColorBox.style.backgroundColor = profile.brandColors.primary;
      secondaryColorBox.style.backgroundColor = profile.brandColors.secondary;
      accentColorBox.style.backgroundColor = profile.brandColors.accent;
    }
  }

  // Get user data
  fetchUserData(token);

  // Load user's posts
  fetchPosts(token);
});

async function fetchUserData(token) {
  try {
    const response = await fetch('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Update user name
    document.getElementById('user-name').textContent = data.user.name || 'User';
    document.getElementById('user-name-profile').textContent = data.user.name || 'User';
    
    // Check if business profile is complete
    if (data.user.businessProfile && Object.keys(data.user.businessProfile).length > 0) {
      // Profile is complete, show complete section and hide incomplete
      document.getElementById('profile-incomplete').style.display = 'none';
      document.getElementById('profile-complete').style.display = 'block';
      
      // Display business profile data
      displayBusinessProfile(data.user.businessProfile);
    } else {
      // Profile is incomplete, show incomplete section and hide complete
      document.getElementById('profile-incomplete').style.display = 'block';
      document.getElementById('profile-complete').style.display = 'none';
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
}

function displayBusinessProfile(profile) {
  // Display business name
  if (profile.businessName) {
    document.getElementById('business-name-display').textContent = profile.businessName;
  }
  
  // Display business industry
  if (profile.industry) {
    document.getElementById('business-industry-display').textContent = profile.industry;
  }
  
  // Display business logo
  if (profile.logoUrl) {
    document.getElementById('business-logo').src = profile.logoUrl;
  }
  
  // Display brand colors
  if (profile.brandColors) {
    if (profile.brandColors.primary) {
      document.getElementById('primary-color-box').style.backgroundColor = profile.brandColors.primary;
    }
    
    if (profile.brandColors.secondary) {
      document.getElementById('secondary-color-box').style.backgroundColor = profile.brandColors.secondary;
    }
    
    if (profile.brandColors.accent) {
      document.getElementById('accent-color-box').style.backgroundColor = profile.brandColors.accent;
    }

    // Apply brand colors to CSS variables
    document.documentElement.style.setProperty('--primary', profile.brandColors.primary);
    document.documentElement.style.setProperty('--primary-dark', adjustColor(profile.brandColors.primary, -20));
    document.documentElement.style.setProperty('--primary-light', adjustColor(profile.brandColors.primary, 20));
    document.documentElement.style.setProperty('--secondary', profile.brandColors.secondary);
    document.documentElement.style.setProperty('--accent', profile.brandColors.accent);
  }
}

// Helper function to darken or lighten a color
function adjustColor(color, amount) {
  // Convert hex to RGB
  let hex = color.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Adjust the color
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

async function fetchPosts(token) {
  try {
    // Show loading
    document.getElementById('posts-loading').style.display = 'block';
    document.getElementById('no-posts').style.display = 'none';
    document.getElementById('posts-list').innerHTML = '';

    const response = await fetch('/api/posts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Hide loading
    document.getElementById('posts-loading').style.display = 'none';
    
    // Update stats
    const scheduledPosts = data.posts.filter(post => post.status === 'scheduled');
    const publishedPosts = data.posts.filter(post => post.status === 'published');
    
    document.getElementById('scheduled-count').textContent = scheduledPosts.length;
    document.getElementById('total-posts').textContent = data.posts.length;
    document.getElementById('published-count').textContent = publishedPosts.length;
    
    if (data.posts.length === 0) {
      // No posts to display
      document.getElementById('no-posts').style.display = 'block';
      return;
    }
    
    // Display scheduled posts
    const postsListContainer = document.getElementById('posts-list');
    
    // Sort posts by schedule date (most recent first)
    scheduledPosts.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    
    if (scheduledPosts.length === 0) {
      document.getElementById('no-posts').style.display = 'block';
      return;
    }
    
    // Display up to 5 most recent scheduled posts
    scheduledPosts.slice(0, 5).forEach(post => {
      const postElement = createPostElement(post);
      postsListContainer.appendChild(postElement);
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    document.getElementById('posts-loading').style.display = 'none';
    document.getElementById('no-posts').style.display = 'block';
  }
}

function createPostElement(post) {
  const postDate = new Date(post.scheduledDate);
  const formattedDate = postDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const postDiv = document.createElement('div');
  postDiv.className = 'scheduled-post-card p-3 mb-3';
  
  // Create platform icon based on selected platforms
  let platformIcons = '';
  if (post.platforms) {
    if (post.platforms.includes('instagram')) {
      platformIcons += '<i class="bi bi-instagram me-2"></i>';
    }
    if (post.platforms.includes('facebook')) {
      platformIcons += '<i class="bi bi-facebook me-2"></i>';
    }
    if (post.platforms.includes('twitter')) {
      platformIcons += '<i class="bi bi-twitter me-2"></i>';
    }
    if (post.platforms.includes('linkedin')) {
      platformIcons += '<i class="bi bi-linkedin me-2"></i>';
    }
  }
  
  postDiv.innerHTML = `
    <div class="d-flex justify-content-between align-items-start">
      <div>
        <div class="d-flex align-items-center mb-2">
          <div class="text-primary fs-5">
            ${platformIcons || '<i class="bi bi-share me-2"></i>'}
          </div>
          <h6 class="mb-0 ms-1">${post.headline || 'Untitled Post'}</h6>
        </div>
        <p class="mb-1 text-truncate" style="max-width: 300px;">${post.caption || 'No caption'}</p>
      </div>
      <div class="text-end">
        <span class="badge bg-primary mb-2">${formattedDate}</span>
        <div>
          <a href="/edit-post.html?id=${post._id}" class="btn btn-sm btn-outline-primary py-0 px-2">
            <i class="bi bi-pencil-square"></i>
          </a>
        </div>
      </div>
    </div>
  `;
  
  return postDiv;
} 