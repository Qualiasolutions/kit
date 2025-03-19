document.addEventListener('DOMContentLoaded', function() {
  console.log('Create Post page loaded');
  
  // Check if user is logged in
  const token = localStorage.getItem('token');
  const isDevelopment = true; // Set to true for development mode

  if (!token && !isDevelopment) {
    window.location.href = 'login.html';
    return;
  }

  // API Endpoints
  const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
  const TEMPLATES_ENDPOINT = `${API_URL}/ai-posts/templates`;
  const BRANDING_ENDPOINT = `${API_URL}/ai-posts/detect-branding`;
  const CONTENT_ENDPOINT = `${API_URL}/ai-posts/generate-content`;
  const PREVIEW_ENDPOINT = `${API_URL}/ai-posts/preview-template`;
  const CREATE_POST_ENDPOINT = `${API_URL}/ai-posts/create`;
  const PROCESS_IMAGE_ENDPOINT = `${API_URL}/ai-posts/process-image`;

  // Current step
  let currentStep = 1;
  
  // Business profile data
  let businessProfile = null;
  
  // Selected data
  let selectedTemplate = null;
  let selectedPlatforms = ['instagram'];
  let generatedContent = null;
  let uploadedImage = null;

  // Initialize the app
  init();

  function init() {
    // Load business profile
    loadBusinessProfile();
    
    // Initialize template selection
    setupTemplateSelection();
    
    // Initialize platform selection
    setupPlatformSelection();
    
    // Add navigation event listeners
    setupNavigation();
  }

  // Setup navigation between steps
  function setupNavigation() {
    // Get step navigation elements
    const stepItems = document.querySelectorAll('.step');
    const stepTabs = document.querySelectorAll('.tab-pane');
    
    // Add event listeners to step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
      step.addEventListener('click', () => {
        if (validatePreviousSteps(index + 1)) {
          goToStep(index + 1);
        }
      });
    });
    
    // Add next/previous buttons to each step
    document.querySelectorAll('.card-body').forEach((cardBody, index) => {
      if (!cardBody.querySelector('.step-navigation')) {
        const navDiv = document.createElement('div');
        navDiv.className = 'step-navigation d-flex justify-content-between mt-4';
        
        // Previous button (except for first step)
        if (index > 0) {
          const prevBtn = document.createElement('button');
          prevBtn.className = 'btn btn-outline-primary prev-step';
          prevBtn.textContent = 'Previous';
          prevBtn.addEventListener('click', () => goToStep(currentStep - 1));
          navDiv.appendChild(prevBtn);
        } else {
          // Empty div for spacing
          const spacer = document.createElement('div');
          navDiv.appendChild(spacer);
        }
        
        // Next button (except for last step)
        if (index < 3) {
          const nextBtn = document.createElement('button');
          nextBtn.className = 'btn btn-primary next-step';
          nextBtn.textContent = 'Next';
          nextBtn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
              goToStep(currentStep + 1);
            }
          });
          navDiv.appendChild(nextBtn);
        } else {
          // Create post button for last step
          const createBtn = document.createElement('button');
          createBtn.className = 'btn btn-success create-post-btn';
          createBtn.textContent = 'Create Post';
          createBtn.addEventListener('click', savePost);
          navDiv.appendChild(createBtn);
        }
        
        cardBody.appendChild(navDiv);
      }
    });
  }

  // Setup template selection functionality
  function setupTemplateSelection() {
    console.log('Setting up template selection');
    
    // Show loading indicator
    const loadingEl = document.querySelector('.loading-templates');
    if (loadingEl) {
      loadingEl.style.display = 'block';
    }
    
    // Get the template container
    const templateContainer = document.querySelector('.template-container');
    if (!templateContainer) return;
    
    // Clear the container
    templateContainer.innerHTML = '';
    
    // Fetch templates from API
    fetch(TEMPLATES_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json();
    })
    .then(data => {
      // Hide loading indicator
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }
      
      if (data.success && data.data && data.data.length > 0) {
        // Create template cards
        data.data.forEach(template => {
          const templateCard = document.createElement('div');
          templateCard.className = 'col-md-3 mb-3';
          templateCard.innerHTML = `
            <div class="template-card" data-template-id="${template.id}">
              <img src="img/templates/${template.id}.jpg" alt="${template.name}" class="template-img mb-2" onerror="this.src='img/placeholder-template.jpg'">
              <h6>${template.name}</h6>
              <p class="small text-muted">${template.description}</p>
            </div>
          `;
          
          // Add click handler
          templateCard.querySelector('.template-card').addEventListener('click', () => {
            // Remove selected class from all templates
            document.querySelectorAll('.template-card').forEach(card => {
              card.classList.remove('selected');
            });
            
            // Add selected class to this template
            templateCard.querySelector('.template-card').classList.add('selected');
            
            // Store selected template
            selectedTemplate = template;
            
            // Update preview
            updateTemplatePreview(template);
            
            // Enable next button
            const nextBtn = document.querySelector('#step1Content .next-step');
            if (nextBtn) {
              nextBtn.disabled = false;
            }
          });
          
          templateContainer.appendChild(templateCard);
        });
      } else {
        // Fallback to predefined templates if API fails
        fallbackToDefaultTemplates();
      }
    })
    .catch(error => {
      console.error('Error fetching templates:', error);
      // Hide loading indicator
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }
      // Fallback to predefined templates
      fallbackToDefaultTemplates();
    });
  }

  // Fallback to predefined templates if API fails
  function fallbackToDefaultTemplates() {
    const templateContainer = document.querySelector('.template-container');
    if (!templateContainer) return;
    
    // Predefined templates
    const templates = [
      { id: 'standard', name: 'Standard Post', description: 'Clean, professional layout for general content', image: 'img/placeholder-template.jpg' },
      { id: 'promotional', name: 'Promotional', description: 'Eye-catching design for sales and promotions', image: 'img/placeholder-template.jpg' },
      { id: 'news', name: 'News Update', description: 'Formal layout for announcements and news', image: 'img/placeholder-template.jpg' },
      { id: 'event', name: 'Event Promotion', description: 'Showcase upcoming events with style', image: 'img/placeholder-template.jpg' }
    ];
    
    // Create template cards
    templates.forEach(template => {
      const templateCard = document.createElement('div');
      templateCard.className = 'col-md-3 mb-3';
      templateCard.innerHTML = `
        <div class="template-card" data-template-id="${template.id}">
          <img src="${template.image}" alt="${template.name}" class="template-img mb-2">
          <h6>${template.name}</h6>
          <p class="small text-muted">${template.description}</p>
        </div>
      `;
      
      // Add click handler
      templateCard.querySelector('.template-card').addEventListener('click', () => {
        // Remove selected class from all templates
        document.querySelectorAll('.template-card').forEach(card => {
          card.classList.remove('selected');
        });
        
        // Add selected class to this template
        templateCard.querySelector('.template-card').classList.add('selected');
        
        // Store selected template
        selectedTemplate = template;
        
        // Update preview
        updateTemplatePreview(template);
        
        // Enable next button
        const nextBtn = document.querySelector('#step1Content .next-step');
        if (nextBtn) {
          nextBtn.disabled = false;
        }
      });
      
      templateContainer.appendChild(templateCard);
    });
  }

  // Update template preview
  function updateTemplatePreview(template) {
    console.log('Updating preview with template:', template.name);
    
    const previewImage = document.querySelector('.preview-image');
    if (previewImage) {
      previewImage.src = template.image || 'img/placeholder-template.jpg';
      previewImage.onerror = () => {
        previewImage.src = 'img/placeholder-template.jpg';
      };
    }
    
    const previewTitle = document.querySelector('.preview-title');
    if (previewTitle) {
      previewTitle.textContent = template.name;
    }
    
    const previewDescription = document.querySelector('.preview-description');
    if (previewDescription) {
      previewDescription.textContent = template.description;
    }
  }

  // Validate current step
  function validateStep(step) {
    switch(step) {
      case 1:
        if (!selectedTemplate) {
          showAlert('Please select a template to continue', 'warning');
          return false;
        }
        return true;
      case 2:
        // Content generation step doesn't need validation for now
        return true;
      case 3:
        // Customization step always valid
        return true;
      case 4:
        // Schedule step always valid
        return true;
      default:
        return false;
    }
  }

  // Validate all steps up to given step
  function validatePreviousSteps(targetStep) {
    for (let i = 1; i < targetStep; i++) {
      if (!validateStep(i)) {
        return false;
      }
    }
    return true;
  }

  // Navigate to specific step
  function goToStep(stepNumber) {
    // Update current step
    currentStep = stepNumber;
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
      if (index + 1 === currentStep) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach((tab, index) => {
      if (index + 1 === currentStep) {
        tab.classList.add('show', 'active');
      } else {
        tab.classList.remove('show', 'active');
      }
    });
    
    // Special actions for specific steps
    if (currentStep === 2) {
      // Auto-generate content when entering step 2
      generateContent();
    }
  }

  // Load business profile
  async function loadBusinessProfile() {
    try {
      const response = await fetch(BRANDING_ENDPOINT, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load business profile');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        businessProfile = data.data;
        updateBusinessProfileUI(businessProfile);
      } else {
        showAlert('Failed to load business profile. Using default values.', 'warning');
      }
    } catch (error) {
      console.error('Error loading business profile:', error);
      showAlert('Error loading business profile', 'danger');
    }
  }

  // Update UI with business profile data
  function updateBusinessProfileUI(profile) {
    // Update business name
    const businessNameElements = document.querySelectorAll('.business-name');
    businessNameElements.forEach(el => {
      el.textContent = profile.name || 'Your Business';
    });
    
    // Update business logo
    if (profile.logo) {
      const logoElements = document.querySelectorAll('.business-logo');
      logoElements.forEach(el => {
        el.src = profile.logo;
        el.onerror = function() {
          this.src = 'img/logo.png';
        };
      });
    }
    
    // Apply brand colors
    if (profile.primaryColor) {
      document.documentElement.style.setProperty('--primary', profile.primaryColor);
      document.documentElement.style.setProperty('--primary-dark', adjustColorBrightness(profile.primaryColor, -20));
    }
  }

  // Helper function to adjust color brightness
  function adjustColorBrightness(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => 
      ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
    );
  }

  // Setup platform selection
  function setupPlatformSelection() {
    const platformButtons = document.querySelectorAll('.platform-btn');
    if (platformButtons) {
      platformButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          const platform = this.dataset.platform;
          
          // Toggle active class
          this.classList.toggle('active');
          
          // Update selected platforms array
          if (this.classList.contains('active')) {
            if (!selectedPlatforms.includes(platform)) {
              selectedPlatforms.push(platform);
            }
          } else {
            selectedPlatforms = selectedPlatforms.filter(p => p !== platform);
          }
          
          // Update platform preview
          updatePlatformPreview();
        });
      });
    }
  }

  // Update platform preview based on selection
  function updatePlatformPreview() {
    const platformPreview = document.querySelector('.selected-platforms');
    if (platformPreview) {
      if (selectedPlatforms.length > 0) {
        platformPreview.innerHTML = selectedPlatforms.map(p => 
          `<span class="badge bg-primary me-1">${p.charAt(0).toUpperCase() + p.slice(1)}</span>`
        ).join('');
      } else {
        platformPreview.innerHTML = '<span class="text-muted">No platforms selected</span>';
      }
    }
  }

  // Generate content for the selected template
  async function generateContent() {
    if (!selectedTemplate) {
      showAlert('Please select a template first', 'warning');
      return;
    }
    
    // Show loading state
    const contentContainer = document.querySelector('#generatedContentContainer');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3">Generating content for ${selectedTemplate.name}...</p>
        </div>
      `;
    }
    
    try {
      // Call API to generate content
      const response = await fetch(CONTENT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate content');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        generatedContent = data.data;
        
        // Update UI with generated content
        updateGeneratedContentUI(generatedContent);
      } else {
        // Fallback to mock content
        fallbackToMockContent();
      }
    } catch (error) {
      console.error('Error generating content:', error);
      // Fallback to mock content
      fallbackToMockContent();
    }
  }

  // Update UI with generated content
  function updateGeneratedContentUI(content) {
    const contentContainer = document.querySelector('#generatedContentContainer');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="mb-3">
          <label for="headline" class="form-label">Headline</label>
          <input type="text" class="form-control" id="headline" value="${content.headline}">
        </div>
        <div class="mb-3">
          <label for="mainText" class="form-label">Main Text</label>
          <textarea class="form-control" id="mainText" rows="3">${content.mainText}</textarea>
        </div>
        <div class="mb-3">
          <label for="callToAction" class="form-label">Call to Action</label>
          <input type="text" class="form-control" id="callToAction" value="${content.callToAction}">
        </div>
        <div class="mb-3">
          <label class="form-label">Hashtags</label>
          <div class="hashtags-container">
            ${content.tags.map(tag => `
              <span class="badge bg-light text-dark p-2 me-1 mb-1">${tag}</span>
            `).join('')}
          </div>
        </div>
        <div class="mb-3">
          <label for="imagePrompt" class="form-label">Image Description</label>
          <textarea class="form-control" id="imagePrompt" rows="2">${content.imagePrompt}</textarea>
        </div>
        <div class="mt-4">
          <button class="btn btn-outline-primary regenerate-btn">
            <i class="bi bi-arrow-repeat me-1"></i> Regenerate
          </button>
        </div>
      `;
      
      // Add event listener to regenerate button
      const regenerateBtn = contentContainer.querySelector('.regenerate-btn');
      if (regenerateBtn) {
        regenerateBtn.addEventListener('click', generateContent);
      }
    }
    
    // Update preview with generated content
    updatePreviewWithContent(content);
  }
  
  // Update preview with generated content
  function updatePreviewWithContent(content) {
    const previewTitle = document.querySelector('.preview-title');
    if (previewTitle) {
      previewTitle.textContent = content.headline;
    }
    
    const previewDescription = document.querySelector('.preview-description');
    if (previewDescription) {
      previewDescription.textContent = content.mainText.substring(0, 100) + '...';
    }
  }

  // Fallback to mock content generation if API fails
  function fallbackToMockContent() {
    console.log('Falling back to mock content generation');
    
    const mockContent = {
      headline: `Amazing ${selectedTemplate.name} for Your Business`,
      mainText: "Showcase your products and services with this professionally designed template. Perfect for engaging your audience and driving conversions.",
      callToAction: "Visit our website today!",
      tags: ["business", "marketing", "professional", "design"],
      imagePrompt: "Professional business image showing success and growth"
    };
    
    generatedContent = mockContent;
    updateGeneratedContentUI(mockContent);
  }

  // Save post to database
  async function savePost() {
    if (!validateAllSteps()) {
      return;
    }
    
    // Show loading state
    showAlert('Creating your post...', 'info');
    
    // Get final content from form fields
    const finalContent = {
      headline: document.querySelector('#headline').value,
      mainText: document.querySelector('#mainText').value,
      callToAction: document.querySelector('#callToAction').value,
      tags: Array.from(document.querySelectorAll('.hashtags-container .badge')).map(badge => badge.textContent.trim()),
      imagePrompt: document.querySelector('#imagePrompt').value
    };
    
    // Get scheduled date if any
    const scheduledDate = document.querySelector('#scheduledDate')?.value;
    
    try {
      // Call API to create post
      const response = await fetch(CREATE_POST_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          content: finalContent,
          imageUrl: uploadedImage?.url,
          platforms: selectedPlatforms,
          scheduledDate,
          status: scheduledDate ? 'scheduled' : 'draft'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      const data = await response.json();
      
      if (data.success) {
        showAlert('Post created successfully!', 'success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        showAlert('Failed to create post: ' + (data.error || 'Unknown error'), 'danger');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      showAlert('Error creating post: ' + error.message, 'danger');
    }
  }

  // Validate all steps
  function validateAllSteps() {
    for (let i = 1; i <= 4; i++) {
      if (!validateStep(i)) {
        goToStep(i);
        return false;
      }
    }
    return true;
  }

  // Create and show alerts
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