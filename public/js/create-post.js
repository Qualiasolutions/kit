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

  // Check if dev mode is enabled
  const devMode = localStorage.getItem('devMode') === 'true';

  // Initialize alert container
  const alertContainer = document.querySelector('.alert-container') || createAlertContainer();

  // Load business profile
  loadBusinessProfile();

  // Add event listener for Generate Content button
  const generateBtn = document.getElementById('generate-content-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateContent);
  }

  // Add event listener for Save Post button
  const savePostBtn = document.getElementById('save-post-btn');
  if (savePostBtn) {
    savePostBtn.addEventListener('click', savePost);
  }

  // Set up platform selection
  setupPlatformSelection();

  // Set default date to tomorrow at 9:00 AM for scheduling
  const postDateInput = document.getElementById('post-date');
  if (postDateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    postDateInput.value = tomorrow.toISOString().slice(0, 16);
  }

  // Previous step button
  const prevStepBtn = document.querySelector('.prev-step');
  if (prevStepBtn) {
    prevStepBtn.addEventListener('click', function() {
      window.history.back();
    });
  }

  // Template selection
  setupTemplateSelection();

  // Back to Dashboard link
  const backToDashboardLink = document.querySelector('[href="dashboard.html"]');
  if (backToDashboardLink) {
    backToDashboardLink.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }

  // Logout event listener
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('devMode');
      localStorage.removeItem('businessProfile');
      
      // Redirect to login page
      window.location.href = 'login.html';
    });
  }

  // Create alert container if it doesn't exist
  function createAlertContainer() {
    const container = document.createElement('div');
    container.className = 'alert-container';
    document.body.prepend(container);
    return container;
  }

  // Function to set up template selection
  function setupTemplateSelection() {
    // Predefined templates
    const templates = [
      { id: 'template1', name: 'Standard Post', description: 'Simple and clean layout' },
      { id: 'template2', name: 'Product Showcase', description: 'Highlight your products' },
      { id: 'template3', name: 'Quote Post', description: 'Share inspiring quotes' },
      { id: 'template4', name: 'Announcement', description: 'Share important news' }
    ];

    // Get template container
    const templateContainer = document.querySelector('.template-container');
    if (!templateContainer) return;

    // Create template cards
    templates.forEach(template => {
      const templateCard = document.createElement('div');
      templateCard.className = 'col-md-3 col-sm-6';
      templateCard.innerHTML = `
        <div class="card template-card" data-template-id="${template.id}">
          <img src="img/templates/${template.id}.jpg" alt="${template.name}" class="card-img-top">
          <div class="card-body">
            <h5 class="card-title">${template.name}</h5>
            <p class="card-text text-muted small">${template.description}</p>
          </div>
        </div>
      `;
      templateContainer.appendChild(templateCard);

      // Add click event
      const card = templateCard.querySelector('.template-card');
      card.addEventListener('click', function() {
        // Remove active class from all cards
        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
        
        // Add active class to clicked card
        this.classList.add('selected');
        
        // Store selected template
        localStorage.setItem('selectedTemplate', template.id);
        
        // Update preview
        updateTemplatePreview(template.id);
      });
    });
  }

  // Load business profile
  async function loadBusinessProfile() {
    try {
      // Check if we're in development mode
      if (devMode) {
        // Get mock profile from localStorage
        const mockProfile = JSON.parse(localStorage.getItem('businessProfile'));
        
        if (mockProfile) {
          // Update UI with profile data
          updateBusinessProfileUI(mockProfile);
        } else {
          console.error('No business profile found in localStorage');
          showAlert('Error loading business profile. Please complete your profile setup.', 'danger');
        }
        return;
      }
      
      // If not in dev mode, fetch from server
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 404) {
        showAlert('Please complete your business profile before creating posts.', 'warning');
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        updateBusinessProfileUI(data.data);
      } else {
        console.error('Error loading profile:', data.error);
        showAlert('Error loading profile. Please try again later.', 'danger');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showAlert('Error loading profile. Please try again later.', 'danger');
    }
  }

  // Update UI with business profile data
  function updateBusinessProfileUI(profile) {
    // Store profile data for content generation
    localStorage.setItem('currentBusinessProfile', JSON.stringify(profile));
    
    // Update business name in preview
    const businessNameElements = document.querySelectorAll('.business-name');
    businessNameElements.forEach(element => {
      if (element) element.textContent = profile.businessName || 'Your Business';
    });
    
    // Update business logo
    const logoImg = document.querySelector('.business-logo img');
    if (logoImg && profile.logo) {
      if (devMode) {
        logoImg.src = profile.logo;
      } else {
        logoImg.src = `${API_URL}/uploads/${profile.logo}`;
      }
    }
    
    // Update business info in preview
    const yourBusinessElement = document.getElementById('your-business');
    if (yourBusinessElement) {
      yourBusinessElement.textContent = profile.businessName || 'Your Business';
    }
    
    // Update brand colors
    if (profile.brandColors) {
      document.documentElement.style.setProperty('--primary', profile.brandColors.primary || '#4361ee');
      document.documentElement.style.setProperty('--primary-dark', profile.brandColors.secondary || '#3a0ca3');
      document.documentElement.style.setProperty('--accent', profile.brandColors.accent || '#f72585');
    }
  }

  // Function to set up platform selection
  function setupPlatformSelection() {
    // Get all platform checkboxes
    const platformCheckboxes = document.querySelectorAll('.platform-checkbox');
    
    // Add event listeners to update UI when platforms are selected
    platformCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        updatePlatformPreview();
      });
    });
  }

  // Function to update platform preview
  function updatePlatformPreview() {
    const platformIcons = document.getElementById('platform-icons');
    if (!platformIcons) return;
    
    platformIcons.innerHTML = '';
    
    // Get all selected platforms
    const selectedPlatforms = [];
    document.querySelectorAll('.platform-checkbox:checked').forEach(checkbox => {
      selectedPlatforms.push(checkbox.value);
    });
    
    // Create icon for each selected platform
    selectedPlatforms.forEach(platform => {
      const icon = document.createElement('span');
      icon.className = 'badge bg-primary me-1';
      icon.innerHTML = `<i class="bi bi-${platform.toLowerCase()}"></i> ${platform}`;
      platformIcons.appendChild(icon);
    });
  }

  // Function to generate content
  function generateContent() {
    // Get selected parameters
    const postType = document.getElementById('post-type')?.value;
    const contentTopic = document.getElementById('content-topic')?.value;
    const contentTone = document.getElementById('content-tone')?.value;
    
    if (!postType) {
      showAlert('Please select a post type', 'warning');
      return;
    }
    
    // Get business profile data
    let businessProfile;
    try {
      businessProfile = JSON.parse(localStorage.getItem('currentBusinessProfile')) || 
                       JSON.parse(localStorage.getItem('businessProfile'));
      if (!businessProfile) {
        throw new Error('Business profile data not found');
      }
    } catch (error) {
      console.error('Error retrieving business profile:', error);
      showAlert('Could not retrieve business profile data. Please try again.', 'danger');
      return;
    }
    
    // Show generating indicator
    const generateBtn = document.getElementById('generate-content-btn');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
    
    // In development mode, use mock generation with timeout
    setTimeout(() => {
      // Generate content based on parameters
      const generatedContent = generateMockContent(businessProfile, postType, contentTopic, contentTone);
      
      // Update post content field
      const postContentField = document.getElementById('post-content');
      if (postContentField) {
        postContentField.value = generatedContent;
      }
      
      // Reset button
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="bi bi-magic"></i> Generate Content';
      
      // Show success message
      showAlert('Content generated successfully!', 'success');
    }, 1500);
  }

  // Function to generate mock content
  function generateMockContent(business, postType, topic, tone) {
    const businessName = business.businessName || 'our business';
    const topicText = topic ? ` about ${topic}` : '';
    const industry = business.industry || 'industry';
    const niche = business.niche || 'niche';
    
    let content = '';
    
    // Generate content based on tone
    switch (tone) {
      case 'professional':
        content = `We're excited to share${topicText}. At ${businessName}, we strive to deliver excellence in everything we do as leaders in the ${industry}/${niche} space. #ProfessionalExcellence #${businessName.replace(/\s+/g, '')}`;
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
        content = `Every day is a new opportunity to grow and excel${topicText}. Join us on this journey to greatness in ${industry}! ✨ #${businessName.replace(/\s+/g, '')} #Inspiration`;
        break;
      default:
        content = `Check out our latest update${topicText}! Don't forget to like and share. #${businessName.replace(/\s+/g, '')} #StayTuned`;
    }
    
    // Add post type specific content
    switch (postType) {
      case 'image':
        content += '\n\n[Image: Add a compelling visual that represents your brand or message]';
        break;
      case 'carousel':
        content += '\n\n[Carousel: Add multiple images showing different aspects of your product/service]';
        break;
      case 'video':
        content += '\n\n[Video: Add a short video clip that showcases your message]';
        break;
    }
    
    return content;
  }

  // Function to update template preview
  function updateTemplatePreview(templateId) {
    const previewImage = document.querySelector('.preview-image');
    if (previewImage) {
      // Set the preview image based on template ID
      previewImage.src = `img/templates/${templateId}.jpg`;
      previewImage.alt = `Template ${templateId}`;
    }
  }

  // Function to save post
  function savePost() {
    try {
      // Get post data
      const postData = {
        type: document.getElementById('post-type')?.value || 'text',
        content: document.getElementById('post-content')?.value || '',
        scheduledDate: document.getElementById('post-date')?.value || new Date().toISOString(),
        platforms: []
      };
      
      // Validate post data
      if (!postData.content) {
        showAlert('Please enter or generate post content', 'warning');
        return;
      }
      
      // Get selected platforms
      document.querySelectorAll('.platform-checkbox:checked').forEach(checkbox => {
        postData.platforms.push(checkbox.value);
      });
      
      if (postData.platforms.length === 0) {
        showAlert('Please select at least one platform', 'warning');
        return;
      }
      
      // In development mode, save to localStorage
      const postsData = JSON.parse(localStorage.getItem('scheduledPosts') || '[]');
      postsData.push({
        id: 'post-' + Date.now(),
        ...postData,
        createdAt: new Date().toISOString()
      });
      
      localStorage.setItem('scheduledPosts', JSON.stringify(postsData));
      
      // Show success message
      showAlert('Post saved successfully!', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } catch (error) {
      console.error('Error saving post:', error);
      showAlert('Error saving post. Please try again later.', 'danger');
    }
  }

  // Function to show alerts
  function showAlert(message, type = 'info') {
    const alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) return;
    
    // Create alert element
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      const alert = alertContainer.querySelector('.alert');
      if (alert) {
        try {
          const bsAlert = new bootstrap.Alert(alert);
          bsAlert.close();
        } catch (e) {
          alert.remove();
        }
      }
    }, 5000);
  }
}); 