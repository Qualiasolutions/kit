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
  const contentFilter = document.getElementById('content-filter');

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    userName.textContent = user.name;
  }

  // Check if we're in dev mode
  const devMode = localStorage.getItem('devMode') === 'true';

  // Load business profile
  loadProfile();
  
  // Add event listener to content filter
  if (contentFilter) {
    contentFilter.addEventListener('change', function() {
      fetchPosts(token, API_URL, this.value);
    });
  }
  
  // Setup AI tool links
  setupAIToolLinks();

  // Logout event listener
  logoutLink.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    localStorage.removeItem('devMode');
    localStorage.removeItem('mockProfile');
    
    // Redirect to login page
    window.location.href = 'login.html';
  });

  // Setup AI Tool links with proper parameters
  function setupAIToolLinks() {
    // Find all action cards
    const actionCards = document.querySelectorAll('.action-card');
    
    actionCards.forEach(card => {
      card.addEventListener('click', function(e) {
        // Get the href attribute
        const href = this.getAttribute('href');
        
        // If it already has parameters, don't modify
        if (href.includes('?')) return;
        
        // Determine the type based on the card's content
        const cardTitle = this.querySelector('h3').textContent.trim().toLowerCase();
        let contentType = '';
        
        if (cardTitle.includes('calendar')) {
          contentType = 'calendar';
        } else if (cardTitle.includes('bio')) {
          contentType = 'bio';
        } else if (cardTitle.includes('hashtag')) {
          contentType = 'hashtags';
        } else {
          contentType = 'post';
        }
        
        // Set the path in localStorage for the create-post page to read
        localStorage.setItem('aiContentType', contentType);
      });
    });
  }

  // Load business profile
  async function loadProfile() {
    try {
      // Check if we're in development mode
      if (devMode) {
        // Check if we have a profile in localStorage
        const mockProfile = JSON.parse(localStorage.getItem('businessProfile')) || JSON.parse(localStorage.getItem('mockProfile'));
        
        if (!mockProfile) {
          // No profile found, show incomplete section
          profileIncomplete.style.display = 'block';
          profileComplete.style.display = 'none';
          return;
        }
        
        // Show profile section
        profileIncomplete.style.display = 'none';
        profileComplete.style.display = 'block';
        
        // Update profile display
        updateProfileDisplay(mockProfile);
        return;
      }
      
      // If not in dev mode, fetch from server
      try {
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
        
        if (data.success && data.data) {
          // Show profile section
          profileIncomplete.style.display = 'none';
          profileComplete.style.display = 'block';
          
          // Update profile display
          updateProfileDisplay(data.data);

          // Also populate business profile for other pages
          localStorage.setItem('businessProfile', JSON.stringify(data.data));
        } else {
          console.error('Error loading profile:', data.error || 'Unknown error');
          profileIncomplete.style.display = 'block';
          profileComplete.style.display = 'none';
        }
      } catch (error) {
        console.error('Error loading profile from server:', error);
        
        // Try to get from localStorage as fallback
        const cachedProfile = localStorage.getItem('businessProfile');
        if (cachedProfile) {
          try {
            const profile = JSON.parse(cachedProfile);
            profileIncomplete.style.display = 'none';
            profileComplete.style.display = 'block';
            updateProfileDisplay(profile);
            console.log('Using cached business profile from localStorage');
          } catch (e) {
            console.error('Error parsing cached profile:', e);
            profileIncomplete.style.display = 'block';
            profileComplete.style.display = 'none';
          }
        } else {
          profileIncomplete.style.display = 'block';
          profileComplete.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error in loadProfile function:', error);
      profileIncomplete.style.display = 'block';
      profileComplete.style.display = 'none';
    }
  }

  // Update profile display
  function updateProfileDisplay(profile) {
    // Business name and industry
    businessNameDisplay.textContent = profile.businessName || 'Your Business';
    
    // Format industry/niche to avoid showing 'null'
    const industry = profile.industry || 'Business';
    const niche = profile.niche || 'General';
    businessIndustryDisplay.textContent = `${industry} / ${niche}`;
    
    // Logo - Fix for displaying logo properly
    if (profile.logo) {
      if (profile.logo.startsWith('http') || profile.logo.startsWith('data:')) {
        // Direct URL or data URL
        businessLogo.src = profile.logo;
      } else if (devMode) {
        // For dev mode with relative path
        businessLogo.src = 'img/placeholder-logo.png';
      } else {
        // For server path
        businessLogo.src = `${API_URL}/uploads/${profile.logo}`;
      }
      businessLogo.classList.remove('placeholder-logo');
    } else {
      // Default logo
      businessLogo.src = 'img/placeholder-logo.png';
      businessLogo.classList.add('placeholder-logo');
    }
    
    // Brand colors
    if (profile.brandColors) {
      primaryColorBox.style.backgroundColor = profile.brandColors.primary || '#007bff';
      secondaryColorBox.style.backgroundColor = profile.brandColors.secondary || '#6c757d';
      accentColorBox.style.backgroundColor = profile.brandColors.accent || '#28a745';
    }
  }

  // Get user data
  fetchUserData(token, API_URL);

  // Load user's posts
  fetchPosts(token, API_URL);
});

async function fetchUserData(token, API_URL) {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Update user name
    const userNameProfile = document.getElementById('user-name-profile');
    const userName = document.getElementById('user-name');
    
    if (userName) {
      userName.textContent = data.data?.name || 'User';
    }
    
    if (userNameProfile) {
      userNameProfile.textContent = data.data?.name || 'User';
    }
    
    // Check if business profile is complete
    if (data.user?.businessProfile && Object.keys(data.user.businessProfile).length > 0) {
      // Profile is complete, show complete section and hide incomplete
      document.getElementById('profile-incomplete').style.display = 'none';
      document.getElementById('profile-complete').style.display = 'block';
      
      // Display business profile data
      displayBusinessProfile(data.user.businessProfile);
    } else {
      // Check if we're in dev mode
      const devMode = localStorage.getItem('devMode') === 'true';
      
      if (devMode) {
        // Check if we have a profile in localStorage
        const mockProfile = JSON.parse(localStorage.getItem('businessProfile')) || JSON.parse(localStorage.getItem('mockProfile'));
        
        if (mockProfile) {
          // Show profile section for dev mode
          document.getElementById('profile-incomplete').style.display = 'none';
          document.getElementById('profile-complete').style.display = 'block';
          
          // Update profile display
          displayBusinessProfile(mockProfile);
          return;
        }
      }
      
      // Profile is incomplete, show incomplete section and hide complete
      document.getElementById('profile-incomplete').style.display = 'block';
      document.getElementById('profile-complete').style.display = 'none';
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Show a fallback message in case of error
    const devMode = localStorage.getItem('devMode') === 'true';
    if (devMode) {
      const mockProfile = JSON.parse(localStorage.getItem('businessProfile')) || JSON.parse(localStorage.getItem('mockProfile'));
      if (mockProfile) {
        document.getElementById('profile-incomplete').style.display = 'none';
        document.getElementById('profile-complete').style.display = 'block';
        displayBusinessProfile(mockProfile);
      }
    }
  }
}

function displayBusinessProfile(profile) {
  // Display business name
  if (profile.businessName) {
    document.getElementById('business-name-display').textContent = profile.businessName;
  }
  
  // Display business industry
  const industry = profile.industry || 'Business';
  const niche = profile.niche || 'General';
  document.getElementById('business-industry-display').textContent = `${industry} / ${niche}`;
  
  // Display business logo
  const businessLogo = document.getElementById('business-logo');
  if (profile.logo) {
    // Handle different logo URL formats
    if (profile.logo.startsWith('http') || profile.logo.startsWith('data:')) {
      // Direct URL (Cloudinary or data URL)
      businessLogo.src = profile.logo;
    } else if (profile.logo === 'no-logo.png') {
      // Default placeholder
      businessLogo.src = 'img/placeholder-logo.png';
    } else {
      // Local server path - construct complete URL
      const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? '' // Empty for local development (relative path)
        : 'https://kit-lime.vercel.app';
      businessLogo.src = `${API_URL}/uploads/${profile.logo}`;
    }
    businessLogo.alt = `${profile.businessName || 'Business'} Logo`;
    businessLogo.classList.remove('placeholder-logo');
  } else {
    // No logo defined, use placeholder
    businessLogo.src = 'img/placeholder-logo.png';
    businessLogo.alt = 'Business Logo';
    businessLogo.classList.add('placeholder-logo');
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
    document.documentElement.style.setProperty('--primary', profile.brandColors.primary || '#007bff');
    document.documentElement.style.setProperty('--primary-dark', adjustColor(profile.brandColors.primary || '#007bff', -20));
    document.documentElement.style.setProperty('--primary-light', adjustColor(profile.brandColors.primary || '#007bff', 20));
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

async function fetchPosts(token, API_URL, filter = 'all') {
  try {
    // Show loading
    document.getElementById('posts-loading').style.display = 'block';
    document.getElementById('no-posts').style.display = 'none';
    document.getElementById('posts-list').innerHTML = '';

    const response = await fetch(`${API_URL}/api/posts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Process posts based on the response format
    let posts = [];
    if (data.data && Array.isArray(data.data)) {
      posts = data.data;
    } else if (data.posts && Array.isArray(data.posts)) {
      posts = data.posts;
    }
    
    // Hide loading
    document.getElementById('posts-loading').style.display = 'none';
    
    // Filter posts based on selection
    let filteredPosts = posts;
    if (filter !== 'all') {
      filteredPosts = posts.filter(post => post.status === filter);
    }
    
    // Update stats
    const scheduledPosts = posts.filter(post => post.status === 'scheduled' || post.isScheduled);
    const publishedPosts = posts.filter(post => post.status === 'published');
    const draftPosts = posts.filter(post => post.status === 'draft' && !post.isScheduled);
    
    document.getElementById('scheduled-count').textContent = scheduledPosts.length;
    document.getElementById('total-posts').textContent = posts.length;
    document.getElementById('published-count').textContent = publishedPosts.length;
    
    if (filteredPosts.length === 0) {
      // No posts to display
      document.getElementById('no-posts').style.display = 'block';
      return;
    }
    
    // Display posts
    const postsListContainer = document.getElementById('posts-list');
    
    // Sort posts by creation date or scheduled date (most recent first)
    filteredPosts.sort((a, b) => {
      const dateA = a.scheduledDate || a.createdAt;
      const dateB = b.scheduledDate || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });
    
    // Display up to 5 most recent posts
    filteredPosts.slice(0, 5).forEach(post => {
      const postElement = createPostElement(post);
      postsListContainer.appendChild(postElement);
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    document.getElementById('posts-loading').style.display = 'none';
    document.getElementById('no-posts').style.display = 'block';
    
    // Check if dev mode is enabled, and use fake data if needed
    if (localStorage.getItem('devMode') === 'true') {
      createDevModePosts();
    }
  }
}

function createPostElement(post) {
  // Use scheduledDate if available, fall back to createdAt
  const postDate = post.scheduledDate ? new Date(post.scheduledDate) : new Date(post.createdAt);
  
  const formattedDate = postDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const postDiv = document.createElement('div');
  postDiv.className = 'scheduled-post-card p-3 mb-3';
  
  // Determine the platform icon
  let platformIcons = '';
  
  // Check different possible platform properties (platform, platforms array)
  if (post.platform) {
    // Single platform as string
    platformIcons = getPlatformIcon(post.platform);
  } else if (post.platforms && Array.isArray(post.platforms)) {
    // Multiple platforms as array
    platformIcons = post.platforms.map(p => getPlatformIcon(p)).join('');
  }
  
  // Add AI badge if it was generated by AI
  const aiGenerated = post.generatedBy === 'ai' || post.isAIGenerated;
  const aiBadge = aiGenerated ? 
    `<span class="badge bg-primary bg-gradient rounded-pill" style="font-size: 0.7rem;"><i class="bi bi-stars me-1"></i>AI</span>` : '';
  
  // Get title from various possible fields
  const title = post.title || post.headline || 'Untitled Post';
  
  // Get content from various possible fields
  const content = post.content || post.caption || post.mainText || 'No content';
  
  postDiv.innerHTML = `
    <div class="d-flex justify-content-between align-items-start">
      <div>
        <div class="d-flex align-items-center mb-2">
          <div class="text-primary fs-5">
            ${platformIcons || '<i class="bi bi-share me-2"></i>'}
          </div>
          <h6 class="mb-0 ms-1">${title}</h6>
          <div class="ms-2">${aiBadge}</div>
        </div>
        <p class="mb-1 text-truncate" style="max-width: 300px;">${content}</p>
      </div>
      <div class="text-end">
        <span class="badge ${post.status === 'scheduled' || post.isScheduled ? 'bg-primary' : 'bg-secondary'} mb-2">${formattedDate}</span>
        <div>
          <a href="create-post.html?id=${post.id || post._id}" class="btn btn-sm btn-outline-primary py-0 px-2">
            <i class="bi bi-pencil-square"></i>
          </a>
        </div>
      </div>
    </div>
  `;
  
  return postDiv;
}

// Helper function to get platform icon
function getPlatformIcon(platform) {
  if (!platform) return '<i class="bi bi-share me-2"></i>';
  
  const platformLower = platform.toLowerCase();
  
  if (platformLower.includes('instagram')) {
    return '<i class="bi bi-instagram me-2"></i>';
  } else if (platformLower.includes('facebook')) {
    return '<i class="bi bi-facebook me-2"></i>';
  } else if (platformLower.includes('twitter') || platformLower.includes('x')) {
    return '<i class="bi bi-twitter me-2"></i>';
  } else if (platformLower.includes('linkedin')) {
    return '<i class="bi bi-linkedin me-2"></i>';
  } else if (platformLower.includes('tiktok')) {
    return '<i class="bi bi-tiktok me-2"></i>';
  } else {
    return '<i class="bi bi-share me-2"></i>';
  }
}

// Create posts in dev mode if needed
function createDevModePosts() {
  const postsListContainer = document.getElementById('posts-list');
  if (!postsListContainer) return;
  
  document.getElementById('posts-loading').style.display = 'none';
  
  // Create some example posts
  const examplePosts = [
    {
      id: 'post_1',
      title: 'AI-Generated: Social Media Strategy',
      content: 'Boost your engagement with these 5 proven social media strategies that will transform your business...',
      platform: 'Instagram',
      status: 'scheduled',
      isAIGenerated: true,
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days from now
    },
    {
      id: 'post_2',
      title: 'Content Marketing Trends 2025',
      content: 'Discover the latest trends in content marketing that will dominate 2025. Stay ahead of the competition...',
      platform: 'LinkedIn',
      status: 'draft',
      isAIGenerated: true,
      createdAt: new Date().toISOString()
    }
  ];
  
  // Update stats
  document.getElementById('scheduled-count').textContent = '1';
  document.getElementById('total-posts').textContent = '2';
  document.getElementById('published-count').textContent = '0';
  
  // Display posts
  examplePosts.forEach(post => {
    const postElement = createPostElement(post);
    postsListContainer.appendChild(postElement);
  });
  
  // Hide no posts message
  document.getElementById('no-posts').style.display = 'none';
} 