document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Check if we're in dev mode
  const devMode = localStorage.getItem('devMode') === 'true';

  // Get mock profile in dev mode
  const mockProfile = devMode ? JSON.parse(localStorage.getItem('mockProfile')) : null;

  // Check if profile is complete
  const profileComplete = mockProfile || localStorage.getItem('profileComplete');
  if (!profileComplete && !devMode) {
    showAlert('Please complete your business profile first.', 'warning');
    // Redirect to profile setup after a delay
    setTimeout(() => {
      window.location.href = 'profile-setup.html';
    }, 2000);
    return;
  }

  // API base URL
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '' : 'https://kit-lime.vercel.app';

  // Business profile data
  let businessProfile = mockProfile || null;
  
  // Current step in the process
  let currentStep = 1;
  
  // Step elements
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const stepContainers = document.querySelectorAll('.step-container');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  
  // Business info elements
  const businessNameDisplay = document.getElementById('business-name-display');
  const businessTypeDisplay = document.getElementById('business-type-display');
  const businessLogo = document.getElementById('business-logo');
  const primaryColor = document.getElementById('primary-color');
  const secondaryColor = document.getElementById('secondary-color');
  const accentColor = document.getElementById('accent-color');
  
  // Template selection elements
  const templateOptions = document.getElementById('template-options');
  const aiTemplateBtn = document.getElementById('ai-template-btn');
  
  // Image upload elements
  const postImage = document.getElementById('post-image');
  const imagePreview = document.getElementById('image-preview');
  const noImageMessage = document.getElementById('no-image-message');
  const removeBgBtn = document.getElementById('remove-bg-btn');
  const enhanceImageBtn = document.getElementById('enhance-image-btn');
  
  // Caption elements
  const ctaSelect = document.getElementById('cta-select');
  const generateContentBtn = document.getElementById('generate-content-btn');
  const postContent = document.getElementById('post-content');
  const postHashtags = document.getElementById('post-hashtags');
  
  // Platform elements
  const platformsContainer = document.getElementById('platforms-container');
  const autoResize = document.getElementById('auto-resize');
  const autoCaption = document.getElementById('auto-caption');
  const previewCaptionText = document.getElementById('preview-caption-text');
  const previewHashtagsText = document.getElementById('preview-hashtags-text');
  
  // Scheduling elements
  const postDate = document.getElementById('post-date');
  const scheduleOptimalTime = document.getElementById('schedule-optimal-time');
  const summaryType = document.getElementById('summary-type');
  const summaryPlatforms = document.getElementById('summary-platforms');
  const summaryTime = document.getElementById('summary-time');
  const savePostBtn = document.getElementById('save-post-btn');
  
  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0); // 6:00 PM
  postDate.value = tomorrow.toISOString().slice(0, 16);
  
  // Initialize
  setupEventListeners();
  loadBusinessProfile();
  
  // Setup all event listeners
  function setupEventListeners() {
    // Step navigation
    nextButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (validateCurrentStep()) {
          goToStep(currentStep + 1);
        }
      });
    });
    
    prevButtons.forEach(button => {
      button.addEventListener('click', () => {
        goToStep(currentStep - 1);
      });
    });
    
    // AI template button
    aiTemplateBtn.addEventListener('click', selectAiTemplate);
    
    // Image upload
    postImage.addEventListener('change', handleImageUpload);
    removeBgBtn.addEventListener('click', removeBackground);
    enhanceImageBtn.addEventListener('click', enhanceImage);
    
    // Caption generation
    ctaSelect.addEventListener('change', updateCTA);
    generateContentBtn.addEventListener('click', generateContent);
    
    // Preview updates
    postContent.addEventListener('input', updatePreview);
    postHashtags.addEventListener('input', updatePreview);
    
    // Save post
    savePostBtn.addEventListener('click', saveAndSchedule);
  }
  
  // Go to a specific step
  function goToStep(step) {
    if (step < 1 || step > stepContainers.length) return;
    
    currentStep = step;
    
    // Hide all steps
    stepContainers.forEach(container => {
      container.classList.add('d-none');
    });
    
    // Show current step
    stepContainers[currentStep - 1].classList.remove('d-none');
    
    // Update step indicators
    stepIndicators.forEach((indicator, index) => {
      if (index + 1 < currentStep) {
        indicator.classList.remove('active');
        indicator.classList.add('completed');
      } else if (index + 1 === currentStep) {
        indicator.classList.remove('completed');
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('completed', 'active');
      }
    });
    
    // Update summary for final step
    if (currentStep === 6) {
      updateSummary();
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  }
  
  // Validate current step
  function validateCurrentStep() {
    switch (currentStep) {
      case 1: // Account
        return true; // Always valid, profile is auto-loaded
        
      case 2: // Template
        const selectedTemplate = document.querySelector('input[name="template"]:checked');
        if (!selectedTemplate) {
          showAlert('Please select a template or use AI to choose one', 'warning');
          return false;
        }
        return true;
        
      case 3: // Image
        if (!imagePreview.src || imagePreview.style.display === 'none') {
          showAlert('Please upload an image', 'warning');
          return false;
        }
        return true;
        
      case 4: // Captions
        if (!postContent.value.trim()) {
          showAlert('Please generate or enter caption text', 'warning');
          return false;
        }
        return true;
        
      case 5: // Platforms
        const selectedPlatforms = document.querySelectorAll('input[name="platform"]:checked');
        if (selectedPlatforms.length === 0) {
          showAlert('Please select at least one platform', 'warning');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  }
  
  // Load business profile
  function loadBusinessProfile() {
    if (devMode && mockProfile) {
      // Use mock profile
      businessProfile = mockProfile;
      applyBusinessProfile();
      loadTemplates();
      loadPlatforms();
      return;
    }
    
    // In production, load from API
    fetch(`${API_URL}/api/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        businessProfile = data.data;
        applyBusinessProfile();
        loadTemplates();
        loadPlatforms();
      } else {
        showAlert('Failed to load business profile', 'danger');
      }
    })
    .catch(error => {
      console.error('Error loading profile:', error);
      if (devMode) {
        // In dev mode, create a mock profile if none exists
        businessProfile = {
          businessName: 'Your Business',
          industry: 'Marketing',
          brandColors: {
            primary: '#4285f4',
            secondary: '#34a853',
            accent: '#ea4335'
          }
        };
        applyBusinessProfile();
        loadTemplates();
        loadPlatforms();
      } else {
        showAlert('Error loading business profile', 'danger');
      }
    });
  }
  
  // Apply business profile to UI
  function applyBusinessProfile() {
    if (!businessProfile) return;
    
    // Set business name and type
    businessNameDisplay.textContent = businessProfile.businessName || 'Your Business';
    businessTypeDisplay.textContent = devMode ? 
      businessProfile.industry || 'Business' : 
      businessProfile.businessType || 'Business';
    
    // Set logo
    if (devMode && businessProfile.logo) {
      businessLogo.src = businessProfile.logo;
    } else if (businessProfile.logoUrl) {
      businessLogo.src = `${API_URL}/uploads/${businessProfile.logoUrl}`;
    }
    
    // Set brand colors
    if (devMode && businessProfile.brandColors) {
      primaryColor.style.backgroundColor = businessProfile.brandColors.primary;
      secondaryColor.style.backgroundColor = businessProfile.brandColors.secondary;
      accentColor.style.backgroundColor = businessProfile.brandColors.accent;
    } else if (businessProfile.primaryColor) {
      primaryColor.style.backgroundColor = businessProfile.primaryColor;
      secondaryColor.style.backgroundColor = businessProfile.secondaryColor;
      accentColor.style.backgroundColor = businessProfile.accentColor;
    }
  }
  
  // Load templates
  function loadTemplates() {
    // Clear container
    templateOptions.innerHTML = '';
    
    // Business type
    const businessType = devMode ? 
      businessProfile?.industry || 'General' : 
      businessProfile?.businessType || 'General';
    
    // Template data - would come from API in production
    const templates = [
      {
        id: 'template-1',
        name: 'Modern & Clean',
        image: 'https://via.placeholder.com/300x300?text=Modern',
        type: 'All'
      },
      {
        id: 'template-2',
        name: 'Bold & Colorful',
        image: 'https://via.placeholder.com/300x300?text=Bold',
        type: 'All'
      },
      {
        id: 'template-3',
        name: `${businessType} Special`,
        image: `https://via.placeholder.com/300x300?text=${businessType}`,
        type: businessType
      }
    ];
    
    // Add templates to UI
    templates.forEach(template => {
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-4';
      col.innerHTML = `
        <div class="card template-card">
          <img src="${template.image}" class="card-img-top" alt="${template.name}">
          <div class="card-body">
            <h5 class="card-title">${template.name}</h5>
            <div class="form-check mt-2">
              <input class="form-check-input" type="radio" name="template" value="${template.id}" id="${template.id}">
              <label class="form-check-label" for="${template.id}">
                Select Template
              </label>
            </div>
          </div>
        </div>
      `;
      templateOptions.appendChild(col);
      
      // Add click handler for the entire card
      const card = col.querySelector('.template-card');
      card.addEventListener('click', () => {
        const radio = col.querySelector('input[type="radio"]');
        radio.checked = true;
        
        // Highlight selected card
        document.querySelectorAll('.template-card').forEach(c => {
          c.classList.remove('selected');
        });
        card.classList.add('selected');
      });
    });
  }
  
  // Load platforms
  function loadPlatforms() {
    // Clear container
    platformsContainer.innerHTML = '';
    
    // Default platforms
    const platforms = ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok'];
    
    // Add platforms to UI
    platforms.forEach(platform => {
      const div = document.createElement('div');
      div.className = 'form-check mb-2';
      div.innerHTML = `
        <input class="form-check-input" type="checkbox" name="platform" value="${platform}" id="platform-${platform.toLowerCase()}">
        <label class="form-check-label" for="platform-${platform.toLowerCase()}">
          <i class="bi bi-${getPlatformIcon(platform)}"></i> ${platform}
        </label>
      `;
      platformsContainer.appendChild(div);
    });
    
    // Check Instagram by default
    const instagram = document.getElementById('platform-instagram');
    if (instagram) instagram.checked = true;
  }
  
  // Select AI template
  function selectAiTemplate() {
    aiTemplateBtn.disabled = true;
    aiTemplateBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Selecting...';
    
    // Simulate AI processing
    setTimeout(() => {
      // Select a random template (in production, this would be AI-driven)
      const templates = document.querySelectorAll('input[name="template"]');
      const randomIndex = Math.floor(Math.random() * templates.length);
      templates[randomIndex].checked = true;
      
      // Highlight selected card
      document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
      });
      templates[randomIndex].closest('.template-card').classList.add('selected');
      
      showAlert('AI has selected the best template for your business!', 'success');
      
      aiTemplateBtn.disabled = false;
      aiTemplateBtn.innerHTML = '<i class="bi bi-magic"></i> Let AI Choose the Best Template';
    }, 1500);
  }
  
  // Handle image upload
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.match('image.*')) {
      showAlert('Please upload a valid image file', 'warning');
      return;
    }
    
    // Read and display image
    const reader = new FileReader();
    reader.onload = function(event) {
      imagePreview.src = event.target.result;
      imagePreview.style.display = 'block';
      if (noImageMessage) noImageMessage.style.display = 'none';
      
      // Enable buttons
      removeBgBtn.disabled = false;
      enhanceImageBtn.disabled = false;
      
      // Update platform preview
      updatePreview();
    };
    reader.readAsDataURL(file);
  }
  
  // Remove background
  function removeBackground() {
    if (!imagePreview.src || imagePreview.style.display === 'none') {
      showAlert('Please upload an image first', 'warning');
      return;
    }
    
    removeBgBtn.disabled = true;
    removeBgBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
    
    // Simulate background removal (would call AI API in production)
    setTimeout(() => {
      // Add visual indicator that background has been removed
      imagePreview.style.background = 'none';
      imagePreview.style.boxShadow = '0 0 15px rgba(0, 123, 255, 0.5)';
      
      showAlert('Background removed successfully!', 'success');
      removeBgBtn.disabled = false;
      removeBgBtn.innerHTML = '<i class="bi bi-eraser"></i> Remove Background';
    }, 1500);
  }
  
  // Enhance image
  function enhanceImage() {
    if (!imagePreview.src || imagePreview.style.display === 'none') {
      showAlert('Please upload an image first', 'warning');
      return;
    }
    
    enhanceImageBtn.disabled = true;
    enhanceImageBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enhancing...';
    
    // Simulate image enhancement (would call AI API in production)
    setTimeout(() => {
      // Add filter to simulate enhancement
      imagePreview.style.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
      
      showAlert('Image enhanced successfully!', 'success');
      enhanceImageBtn.disabled = false;
      enhanceImageBtn.innerHTML = '<i class="bi bi-magic"></i> Enhance Image';
    }, 1500);
  }
  
  // Generate content based on CTA
  function generateContent() {
    const businessName = businessProfile?.businessName || 'our business';
    const businessType = devMode ? 
      businessProfile?.industry || 'business' : 
      businessProfile?.businessType || 'business';
    
    generateContentBtn.disabled = true;
    generateContentBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...';
    
    // Simulate AI generation delay
    setTimeout(() => {
      const cta = ctaSelect.value;
      let caption = '';
      
      // Generate different content based on selected CTA
      switch (cta) {
        case 'visit':
          caption = `Check out our latest offerings at ${businessName}! We specialize in providing top-quality ${businessType} solutions. Visit us today and experience the difference!`;
          break;
        case 'call':
          caption = `Looking for the best ${businessType} services? Look no further! At ${businessName}, we provide exceptional quality and service. Call us now to learn more!`;
          break;
        case 'book':
          caption = `Ready to elevate your experience with ${businessName}? We're experts in ${businessType} and can't wait to work with you. Book an appointment today!`;
          break;
        case 'order':
          caption = `Introducing our amazing products at ${businessName}! As leaders in ${businessType}, we ensure quality with every order. Order yours today while supplies last!`;
          break;
        case 'dm':
          caption = `Have questions about our ${businessType} services? At ${businessName}, we're here to help! DM us for more details and start your journey with us today.`;
          break;
        case 'learn':
          caption = `Discover what makes ${businessName} the top choice for ${businessType}. We combine quality, service, and expertise in everything we do. Learn more by clicking the link in bio!`;
          break;
        default:
          caption = `We're excited to share our latest updates from ${businessName}! As your trusted ${businessType} provider, we're committed to excellence in everything we do.`;
      }
      
      // Generate hashtags
      const hashtags = [
        `#${businessType.replace(/\s+/g, '')}`,
        '#Quality',
        '#Service',
        `#${businessName.replace(/\s+/g, '')}`,
        '#NewPost',
        '#FollowUs'
      ].join(' ');
      
      // Update UI
      postContent.value = caption;
      postHashtags.value = hashtags;
      
      // Update preview
      updatePreview();
      
      showAlert('Caption and hashtags generated successfully!', 'success');
      generateContentBtn.disabled = false;
      generateContentBtn.innerHTML = '<i class="bi bi-magic"></i> Generate Caption & Hashtags';
    }, 1500);
  }
  
  // Update CTA in existing caption
  function updateCTA() {
    if (postContent.value) {
      generateContent();
    }
  }
  
  // Update platform preview
  function updatePreview() {
    if (previewCaptionText) {
      previewCaptionText.textContent = postContent.value || 'Your caption will appear here...';
    }
    
    if (previewHashtagsText) {
      previewHashtagsText.textContent = postHashtags.value || '#hashtags #will #appear #here';
    }
    
    // Would update image preview in production
  }
  
  // Update summary for final step
  function updateSummary() {
    // Get selected platforms
    const platforms = [];
    document.querySelectorAll('input[name="platform"]:checked').forEach(platform => {
      platforms.push(platform.value);
    });
    
    // Update summary elements
    summaryType.textContent = 'Image Post';
    summaryPlatforms.textContent = platforms.join(', ') || 'None selected';
    
    // Set scheduled time
    if (scheduleOptimalTime.checked) {
      summaryTime.textContent = 'Optimal time (around 6:00 PM)';
    } else {
      const date = new Date(postDate.value);
      summaryTime.textContent = date.toLocaleString();
    }
  }
  
  // Save and schedule post
  function saveAndSchedule() {
    if (!validateCurrentStep()) return;
    
    savePostBtn.disabled = true;
    savePostBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Scheduling...';
    
    // Simulate saving to server
    setTimeout(() => {
      showAlert('Your post has been scheduled successfully!', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    }, 1500);
  }
  
  // Helper: Get platform icon
  function getPlatformIcon(platform) {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'instagram';
      case 'facebook': return 'facebook';
      case 'twitter': return 'twitter';
      case 'linkedin': return 'linkedin';
      case 'tiktok': return 'tiktok';
      default: return 'globe';
    }
  }
  
  // Show alert message
  function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      const alert = alertContainer.querySelector('.alert');
      if (alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
  }
});
