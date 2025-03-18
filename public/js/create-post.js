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

  // Initialize UI elements
  initializeUI();
  
  // Load business profile data
  loadBusinessProfile(token, API_URL);
  
  // Load templates
  loadTemplates();
  
  // Set up event listeners
  setupEventListeners(API_URL);
  
  // Set up logout functionality
  document.getElementById('logout-link').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
  });
});

// Global variables
let currentStep = 1;
let selectedTemplate = null;
let businessProfile = null;
let selectedPlatforms = ['instagram'];
const devMode = false;

function initializeUI() {
  // Hide all steps except the first one
  document.getElementById('content-generation').style.display = 'none';
  document.getElementById('customize-content').style.display = 'none';
  document.getElementById('schedule-post').style.display = 'none';
  document.getElementById('prev-step-btn').style.display = 'none';
  
  // Initialize form fields for real-time preview
  document.getElementById('headline').addEventListener('input', updatePreview);
  document.getElementById('caption').addEventListener('input', updatePreview);
  document.getElementById('call-to-action').addEventListener('input', updatePreview);
  document.getElementById('hashtags').addEventListener('input', updatePreview);
  
  // Initialize image upload preview
  document.getElementById('image-upload').addEventListener('change', handleImageUpload);
}

function setupEventListeners(API_URL) {
  // Next and Previous buttons for multi-step process
  document.getElementById('next-step-btn').addEventListener('click', nextStep);
  document.getElementById('prev-step-btn').addEventListener('click', prevStep);
  
  // AI Toggle
  document.getElementById('use-ai').addEventListener('change', function() {
    const aiOptions = document.getElementById('ai-options');
    const manualContent = document.getElementById('manual-content');
    
    if (this.checked) {
      aiOptions.style.display = 'block';
      manualContent.style.display = 'none';
    } else {
      aiOptions.style.display = 'none';
      manualContent.style.display = 'block';
    }
  });
  
  // Schedule Toggle
  document.getElementById('schedule-toggle').addEventListener('change', function() {
    const scheduleOptions = document.getElementById('schedule-options');
    const publishNow = document.getElementById('publish-now');
    
    if (this.checked) {
      scheduleOptions.style.display = 'block';
      publishNow.style.display = 'none';
    } else {
      scheduleOptions.style.display = 'none';
      publishNow.style.display = 'block';
    }
  });
  
  // Generate content button
  document.getElementById('generate-btn').addEventListener('click', function() {
    generateContent(API_URL);
  });
  
  // Platform selection buttons
  const platformButtons = document.querySelectorAll('.platform-btn');
  platformButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const platform = this.getAttribute('data-platform');
      this.classList.toggle('active');
      
      if (this.classList.contains('active')) {
        if (!selectedPlatforms.includes(platform)) {
          selectedPlatforms.push(platform);
        }
      } else {
        const index = selectedPlatforms.indexOf(platform);
        if (index > -1) {
          selectedPlatforms.splice(index, 1);
        }
      }
      
      // Update preview platform icon
      updatePlatformPreview();
    });
  });
  
  // Save post button
  document.getElementById('save-post-btn').addEventListener('click', function() {
    savePost(API_URL);
  });
  
  // Preview button
  document.getElementById('preview-post-btn').addEventListener('click', function() {
    // Scroll to preview on mobile
    const previewCard = document.querySelector('.col-lg-4 .card');
    previewCard.scrollIntoView({ behavior: 'smooth' });
  });
}

function nextStep() {
  // Validation for each step
  if (currentStep === 1 && !selectedTemplate) {
    showAlert('Please select a template before proceeding.', 'danger');
    return;
  }
  
  // Hide current step
  hideCurrentStep();
  
  // Update step indicator
  document.getElementById(`step-${currentStep}`).classList.add('completed');
  currentStep++;
  document.getElementById(`step-${currentStep}`).classList.add('active');
  
  // Show new step
  showCurrentStep();
  
  // Update navigation buttons
  updateNavigationButtons();
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep() {
  // Hide current step
  hideCurrentStep();
  
  // Update step indicator
  document.getElementById(`step-${currentStep}`).classList.remove('active');
  currentStep--;
  document.getElementById(`step-${currentStep}`).classList.remove('completed');
  document.getElementById(`step-${currentStep}`).classList.add('active');
  
  // Show new step
  showCurrentStep();
  
  // Update navigation buttons
  updateNavigationButtons();
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideCurrentStep() {
  switch (currentStep) {
    case 1:
      document.getElementById('template-selection').style.display = 'none';
      break;
    case 2:
      document.getElementById('content-generation').style.display = 'none';
      break;
    case 3:
      document.getElementById('customize-content').style.display = 'none';
      break;
    case 4:
      document.getElementById('schedule-post').style.display = 'none';
      break;
  }
}

function showCurrentStep() {
  switch (currentStep) {
    case 1:
      document.getElementById('template-selection').style.display = 'block';
      break;
    case 2:
      document.getElementById('content-generation').style.display = 'block';
      break;
    case 3:
      document.getElementById('customize-content').style.display = 'block';
      break;
    case 4:
      document.getElementById('schedule-post').style.display = 'block';
      
      // Set default schedule date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedDate = tomorrow.toISOString().split('T')[0];
      document.getElementById('schedule-date').value = formattedDate;
      
      // Set default time to noon
      document.getElementById('schedule-time').value = '12:00';
      break;
  }
}

function updateNavigationButtons() {
  const prevBtn = document.getElementById('prev-step-btn');
  const nextBtn = document.getElementById('next-step-btn');
  
  // Show/hide previous button
  if (currentStep === 1) {
    prevBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'block';
  }
  
  // Update next button text on last step
  if (currentStep === 4) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'block';
  }
}

async function loadBusinessProfile(token, API_URL) {
  try {
    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load business profile');
    }
    
    const data = await response.json();
    
    if (data.user && data.user.businessProfile) {
      businessProfile = data.user.businessProfile;
      
      // Update UI with business profile data
      updateBusinessProfileUI(businessProfile);
    } else {
      // Check if we're in dev mode
      const devMode = localStorage.getItem('devMode') === 'true';
      if (devMode) {
        const mockProfile = JSON.parse(localStorage.getItem('mockProfile'));
        if (mockProfile) {
          businessProfile = mockProfile;
          updateBusinessProfileUI(mockProfile);
          return;
        }
      }
      
      // Redirect to profile setup if no profile exists
      window.location.href = 'profile-setup.html';
    }
  } catch (error) {
    console.error('Error loading business profile:', error);
    // Try fallback for dev mode
    const devMode = localStorage.getItem('devMode') === 'true';
    if (devMode) {
      const mockProfile = JSON.parse(localStorage.getItem('mockProfile'));
      if (mockProfile) {
        businessProfile = mockProfile;
        updateBusinessProfileUI(mockProfile);
        return;
      }
    }
    
    showAlert('Failed to load your business profile. Please try again later.', 'danger');
  }
}

function updateBusinessProfileUI(profile) {
  // Update preview with business name
  document.getElementById('preview-business-name').textContent = profile.businessName || 'Your Business';
  
  // Update brand colors if available
  if (profile.brandColors) {
    // Apply brand colors to CSS variables for consistent theming
    document.documentElement.style.setProperty('--primary', profile.brandColors.primary);
    document.documentElement.style.setProperty('--primary-dark', adjustColor(profile.brandColors.primary, -20));
    document.documentElement.style.setProperty('--primary-light', adjustColor(profile.brandColors.primary, 20));
    document.documentElement.style.setProperty('--secondary', profile.brandColors.secondary);
    document.documentElement.style.setProperty('--accent', profile.brandColors.accent);
  }
}

// Helper function to adjust color brightness
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

function loadTemplates() {
  const templateContainer = document.getElementById('template-container');
  const loadingElement = document.getElementById('template-loading');
  
  // Template data
  const templates = [
    { 
      id: 1, 
      name: 'Modern & Clean', 
      description: 'Minimalist design with focus on your brand message',
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&q=80',
      tag: 'Modern'
    },
    { 
      id: 2, 
      name: 'Bold & Colorful', 
      description: 'Eye-catching design with vibrant colors and emphasis',
      image: 'https://images.unsplash.com/photo-1586936893354-362ad6ae47ba?w=500&q=80',
      tag: 'Bold'
    },
    { 
      id: 3, 
      name: 'Business Special', 
      description: 'Professional layout perfect for corporate communications',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80',
      tag: 'Professional'
    },
    { 
      id: 4, 
      name: 'Minimalist', 
      description: 'Clean design with lots of whitespace and subtle accents',
      image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&q=80',
      tag: 'Minimalist'
    },
    { 
      id: 5, 
      name: 'Gradient Style', 
      description: 'Modern gradient backgrounds with balanced typography',
      image: 'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=500&q=80',
      tag: 'Trendy'
    },
    { 
      id: 6, 
      name: 'Creative Layout', 
      description: 'Artistic design for brands that want to stand out',
      image: 'https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?w=500&q=80',
      tag: 'Creative'
    },
    { 
      id: 7, 
      name: 'Seasonal Promo', 
      description: 'Perfect for seasonal promotions and holiday campaigns',
      image: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=500&q=80',
      tag: 'Seasonal'
    },
    { 
      id: 8, 
      name: 'Product Showcase', 
      description: 'Highlight your products with this showcase layout',
      image: 'https://images.unsplash.com/photo-1603738733651-31b4a1c0af9e?w=500&q=80',
      tag: 'Products'
    },
    { 
      id: 9, 
      name: 'Quote Template', 
      description: 'Elegant design for sharing quotes and testimonials',
      image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&q=80',
      tag: 'Quotes'
    },
    { 
      id: 10, 
      name: 'Call to Action', 
      description: 'Focused template to drive audience engagement and actions',
      image: 'https://images.unsplash.com/photo-1552663651-2e4250e6c7e8?w=500&q=80',
      tag: 'CTA'
    }
  ];
  
  // Simulate loading delay
  setTimeout(() => {
    // Clear loading
    loadingElement.style.display = 'none';
    
    // Create template cards
    templates.forEach(template => {
      const colDiv = document.createElement('div');
      colDiv.className = 'col-md-4';
      
      const templateCard = document.createElement('div');
      templateCard.className = 'template-card';
      templateCard.setAttribute('data-template-id', template.id);
      
      templateCard.innerHTML = `
        <img src="${template.image}" alt="${template.name}" class="template-image">
        <div class="template-overlay">
          <div class="template-title">${template.name}</div>
          <span class="badge bg-primary">${template.tag}</span>
        </div>
      `;
      
      // Add click event to select template
      templateCard.addEventListener('click', function() {
        // Remove selected class from all templates
        document.querySelectorAll('.template-card').forEach(card => {
          card.classList.remove('selected');
        });
        
        // Add selected class to clicked template
        this.classList.add('selected');
        
        // Set selected template
        selectedTemplate = template.id;
      });
      
      colDiv.appendChild(templateCard);
      templateContainer.appendChild(colDiv);
    });
  }, 500);
}

async function generateContent(API_URL) {
  if (!selectedTemplate) {
    showAlert('Please select a template first', 'warning');
    return;
  }
  
  if (!businessProfile) {
    showAlert('Business profile data is required for content generation', 'warning');
    return;
  }
  
  // Show generating indicator
  const generatingIndicator = document.getElementById('generating-indicator');
  generatingIndicator.style.display = 'block';
  document.getElementById('generate-btn').disabled = true;
  
  try {
    // Call the server to generate content
    const result = await generateWithServerOpenAI(businessProfile, selectedTemplate, API_URL);
    
    if (result) {
      // Fill in the form fields with generated content
      document.getElementById('headline').value = result.headline || '';
      document.getElementById('caption').value = result.caption || '';
      document.getElementById('call-to-action').value = result.callToAction || '';
      document.getElementById('hashtags').value = result.hashtags || '';
      document.getElementById('image-description').value = result.imageDescription || '';
      
      // Update preview
      updatePreview();
      
      // Automatically move to next step after successful generation
      setTimeout(() => {
        nextStep();
      }, 1000);
      
      showAlert('Content generated successfully!', 'success');
    }
  } catch (error) {
    console.error('Error generating content:', error);
    showAlert('Failed to generate content. Please try again.', 'danger');
  } finally {
    // Hide generating indicator
    generatingIndicator.style.display = 'none';
    document.getElementById('generate-btn').disabled = false;
  }
}

async function generateWithServerOpenAI(businessData, templateId, API_URL) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/api/posts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        businessData,
        templateId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate content');
    }
    
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error in content generation:', error);
    throw error;
  }
}

function updatePreview() {
  // Get values from form
  const headline = document.getElementById('headline').value || 'Your Headline Will Appear Here';
  const caption = document.getElementById('caption').value || 'Your caption will appear here.';
  const callToAction = document.getElementById('call-to-action').value || 'Call to action will appear here.';
  const hashtags = document.getElementById('hashtags').value || '#hashtags #will #appear #here';
  
  // Update preview
  document.getElementById('preview-headline').textContent = headline;
  document.getElementById('preview-caption').textContent = caption;
  document.getElementById('preview-cta').textContent = callToAction;
  document.getElementById('preview-hashtags').textContent = hashtags;
}

function updatePlatformPreview() {
  // Get first selected platform for preview
  let platformIcon = '<i class="bi bi-share"></i>';
  
  if (selectedPlatforms.includes('instagram')) {
    platformIcon = '<i class="bi bi-instagram"></i>';
  } else if (selectedPlatforms.includes('facebook')) {
    platformIcon = '<i class="bi bi-facebook"></i>';
  } else if (selectedPlatforms.includes('twitter')) {
    platformIcon = '<i class="bi bi-twitter"></i>';
  } else if (selectedPlatforms.includes('linkedin')) {
    platformIcon = '<i class="bi bi-linkedin"></i>';
  }
  
  // Update preview
  document.querySelector('.preview-header .text-primary').innerHTML = platformIcon;
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      // Update preview image
      document.getElementById('preview-image').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

async function savePost(API_URL) {
  // Show saving indicator
  document.getElementById('saving-indicator').style.display = 'block';
  document.getElementById('save-post-btn').disabled = true;
  
  try {
    // Get form data
    const headline = document.getElementById('headline').value;
    const caption = document.getElementById('caption').value;
    const callToAction = document.getElementById('call-to-action').value;
    const hashtags = document.getElementById('hashtags').value;
    const imageDescription = document.getElementById('image-description').value;
    
    // Check if scheduling is enabled
    const isScheduled = document.getElementById('schedule-toggle').checked;
    let scheduledDate = null;
    
    if (isScheduled) {
      const dateInput = document.getElementById('schedule-date').value;
      const timeInput = document.getElementById('schedule-time').value;
      
      if (!dateInput || !timeInput) {
        showAlert('Please select both date and time for scheduling', 'warning');
        document.getElementById('saving-indicator').style.display = 'none';
        document.getElementById('save-post-btn').disabled = false;
        return;
      }
      
      // Create datetime string in ISO format
      scheduledDate = new Date(`${dateInput}T${timeInput}`);
    }
    
    // Create form data for image upload
    const formData = new FormData();
    formData.append('headline', headline);
    formData.append('caption', caption);
    formData.append('callToAction', callToAction);
    formData.append('hashtags', hashtags);
    formData.append('imageDescription', imageDescription);
    formData.append('templateId', selectedTemplate);
    formData.append('platforms', JSON.stringify(selectedPlatforms));
    
    if (isScheduled) {
      formData.append('isScheduled', 'true');
      formData.append('scheduledDate', scheduledDate.toISOString());
      formData.append('status', 'scheduled');
    } else {
      formData.append('isScheduled', 'false');
      formData.append('status', 'published');
    }
    
    // Add image if selected
    const imageFile = document.getElementById('image-upload').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    // Send to server
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save post');
    }
    
    // Show success message
    showAlert('Post saved successfully!', 'success');
    
    // Redirect to dashboard after delay
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  } catch (error) {
    console.error('Error saving post:', error);
    showAlert('Failed to save post. Please try again.', 'danger');
    document.getElementById('saving-indicator').style.display = 'none';
    document.getElementById('save-post-btn').disabled = false;
  }
}

function showAlert(message, type = 'info') {
  // Create alert element
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-4`;
  alertDiv.style.zIndex = '9999';
  alertDiv.style.minWidth = '300px';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Add to document
  document.body.appendChild(alertDiv);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => {
      alertDiv.remove();
    }, 150);
  }, 5000);
} 