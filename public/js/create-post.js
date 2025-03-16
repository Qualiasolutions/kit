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
  const postForm = document.getElementById('post-form');
  const postType = document.getElementById('post-type');
  const platformsContainer = document.getElementById('platforms-container');
  const postContent = document.getElementById('post-content');
  const postImage = document.getElementById('post-image');
  const postDate = document.getElementById('post-date');
  const scheduleOptimalTime = document.getElementById('schedule-optimal-time');
  const contentTopic = document.getElementById('content-topic');
  const contentTone = document.getElementById('content-tone');
  const generateContentBtn = document.getElementById('generate-content-btn');
  const savePostBtn = document.getElementById('save-post-btn');
  const logoutLink = document.getElementById('logout-link');

  // Set default date to tomorrow at 9:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  postDate.value = tomorrow.toISOString().slice(0, 16);

  // Load user profile to get platforms
  loadProfile();

  // Event listeners
  generateContentBtn.addEventListener('click', generateContent);
  savePostBtn.addEventListener('click', savePost);
  
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
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Update platforms based on business profile
          updatePlatforms(data.data.socialPlatforms || []);
        }
      } else {
        console.error('Error loading profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // Update platforms based on profile
  function updatePlatforms(platforms) {
    // If platforms are empty, use defaults (already in HTML)
    if (!platforms.length) return;
    
    // Otherwise, generate checkboxes based on profile
    platformsContainer.innerHTML = '';
    
    platforms.forEach(platform => {
      const checkboxDiv = document.createElement('div');
      checkboxDiv.className = 'form-check mb-2';
      
      const checkbox = document.createElement('input');
      checkbox.className = 'form-check-input platform-checkbox';
      checkbox.type = 'checkbox';
      checkbox.value = platform;
      checkbox.id = `platform-${platform.toLowerCase()}`;
      checkbox.checked = true; // Check by default
      
      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.htmlFor = `platform-${platform.toLowerCase()}`;
      label.textContent = platform;
      
      checkboxDiv.appendChild(checkbox);
      checkboxDiv.appendChild(label);
      platformsContainer.appendChild(checkboxDiv);
    });
  }

  // Generate content based on profile and selected parameters
  async function generateContent() {
    try {
      // Get selected parameters
      const type = postType.value;
      const topic = contentTopic.value;
      const tone = contentTone.value;
      
      if (!type) {
        alert('Please select a post type');
        return;
      }
      
      generateContentBtn.disabled = true;
      generateContentBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
      
      // In a real implementation, this would be an API call to generate content
      // For now, simulate with timeout and placeholder content
      setTimeout(() => {
        const generatedContent = generatePlaceholderContent(type, topic, tone);
        postContent.value = generatedContent;
        
        generateContentBtn.disabled = false;
        generateContentBtn.innerHTML = '<i class="bi bi-magic"></i> Generate Content';
      }, 1500);
    } catch (error) {
      console.error('Error generating content:', error);
      generateContentBtn.disabled = false;
      generateContentBtn.innerHTML = '<i class="bi bi-magic"></i> Generate Content';
    }
  }

  // Save and schedule the post
  async function savePost() {
    try {
      // Validate form
      if (!validateForm()) {
        return;
      }
      
      // Get selected platforms
      const selectedPlatforms = [];
      document.querySelectorAll('.platform-checkbox:checked').forEach(checkbox => {
        selectedPlatforms.push(checkbox.value);
      });
      
      if (selectedPlatforms.length === 0) {
        alert('Please select at least one platform');
        return;
      }
      
      // Prepare post data
      const postData = {
        type: postType.value,
        content: postContent.value,
        scheduledDate: postDate.value,
        useOptimalTime: scheduleOptimalTime.checked,
        platforms: selectedPlatforms
      };
      
      // In a real implementation, this would make an API call to save the post
      // For now, just show success message and redirect
      alert('Post scheduled successfully!');
      window.location.href = 'dashboard.html';
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post. Please try again.');
    }
  }

  // Validate form
  function validateForm() {
    if (!postType.value) {
      alert('Please select a post type');
      postType.focus();
      return false;
    }
    
    if (!postContent.value.trim()) {
      alert('Please enter or generate post content');
      postContent.focus();
      return false;
    }
    
    if (!postDate.value) {
      alert('Please select a scheduled date');
      postDate.focus();
      return false;
    }
    
    return true;
  }

  // Generate placeholder content (this would be replaced with actual API call)
  function generatePlaceholderContent(type, topic, tone) {
    const topicText = topic ? ` about ${topic}` : '';
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const businessName = user.businessName || 'our business';
    
    let content = '';
    
    switch (tone) {
      case 'professional':
        content = `We're excited to share${topicText}. At ${businessName}, we strive to deliver excellence in everything we do. #ProfessionalExcellence #${businessName.replace(/\s+/g, '')}`;
        break;
      case 'casual':
        content = `Hey everyone! Check out what's new${topicText}. We'd love to hear your thoughts! #${businessName.replace(/\s+/g, '')} #StayConnected`;
        break;
      case 'friendly':
        content = `Hi friends! We've got something special${topicText} that we can't wait to share with you. Let us know what you think! #${businessName.replace(/\s+/g, '')} #Community`;
        break;
      case 'humorous':
        content = `Who else needs a laugh today?${topicText} 😂 Tag someone who needs to see this! #${businessName.replace(/\s+/g, '')} #LOL`;
        break;
      case 'inspirational':
        content = `Every day is a new opportunity to grow and excel${topicText}. Join us on this journey to greatness! ✨ #${businessName.replace(/\s+/g, '')} #Inspiration`;
        break;
      default:
        content = `Check out our latest update${topicText}! Don't forget to like and share. #${businessName.replace(/\s+/g, '')} #StayTuned`;
    }
    
    return content;
  }
}); 