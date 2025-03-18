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

  // Next step button
  const nextStepBtn = document.getElementById('next-step-btn');
  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', function() {
      // Get current step
      const currentStepNumber = getCurrentStep();
      
      // Validate current step
      if (!validateStep(currentStepNumber)) {
        return;
      }
      
      // Move to next step
      goToStep(currentStepNumber + 1);
    });
  }

  // Create alert container if it doesn't exist
  function createAlertContainer() {
    const container = document.createElement('div');
    container.className = 'alert-container';
    document.body.prepend(container);
    return container;
  }

  // Setup template selection functionality
  function setupTemplateSelection() {
    // Hide loading indicator after templates are loaded
    const loadingEl = document.querySelector('.loading-templates');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    // Find or create template container
    let templateContainer = document.querySelector('.template-container');
    if (!templateContainer) {
        templateContainer = document.createElement('div');
        templateContainer.className = 'template-container row mt-4';
        const cardBody = document.querySelector('.template-selection-card .card-body');
        if (cardBody) {
            cardBody.appendChild(templateContainer);
        }
    }
    
    // Clear any existing templates
    templateContainer.innerHTML = '';
    
    // Get templates (in real app, these would come from an API)
    const templates = [
        { id: 1, name: 'Standard Post', description: 'Clean, professional layout for general content', image: '/img/placeholder-template.jpg' },
        { id: 2, name: 'Promotional', description: 'Eye-catching design for sales and promotions', image: '/img/placeholder-template.jpg' },
        { id: 3, name: 'News Update', description: 'Formal layout for announcements and news', image: '/img/placeholder-template.jpg' },
        { id: 4, name: 'Event Promotion', description: 'Showcase upcoming events with style', image: '/img/placeholder-template.jpg' }
    ];
    
    // Store templates in localStorage for development
    localStorage.setItem('templates', JSON.stringify(templates));
    
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
        
        // Add click handler to select template
        templateCard.querySelector('.template-card').addEventListener('click', () => {
            // Remove selected class from all templates
            document.querySelectorAll('.template-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Add selected class to this template
            templateCard.querySelector('.template-card').classList.add('selected');
            
            // Store selected template
            localStorage.setItem('selectedTemplate', JSON.stringify(template));
            
            // Update preview
            updateTemplatePreview(template);
            
            // Enable next button
            const nextButton = document.querySelector('#nextStepBtn');
            if (nextButton) {
                nextButton.disabled = false;
            }
        });
        
        templateContainer.appendChild(templateCard);
    });

    // Create default template images if they don't exist
    createDefaultTemplateImages();
  }

  // Update template preview based on selected template
  function updateTemplatePreview(template) {
    const previewImage = document.querySelector('.preview-image');
    if (previewImage) {
        // Set src and add error handler
        previewImage.src = template.image;
        previewImage.onerror = () => {
            previewImage.src = '/img/placeholder-template.jpg';
        };
    }
    
    // Update preview content
    const previewTitle = document.querySelector('.preview-title');
    if (previewTitle) {
        previewTitle.textContent = template.name;
    }
    
    const previewDescription = document.querySelector('.preview-description');
    if (previewDescription) {
        previewDescription.textContent = template.description;
    }
  }

  // Create default template images and store in localStorage
  function createDefaultTemplateImages() {
    // Use these keys to check if images are already stored
    const templateImageKeys = [
        'template1Image',
        'template2Image',
        'template3Image',
        'template4Image'
    ];
    
    // Check if we need to create images
    const needsImages = !localStorage.getItem(templateImageKeys[0]);
    
    if (needsImages) {
        // Store default image paths
        templateImageKeys.forEach((key, index) => {
            localStorage.setItem(key, '/img/placeholder-template.jpg');
        });
    }
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

  // Get current step
  function getCurrentStep() {
    const activeStep = document.querySelector('.step-item.active');
    if (activeStep) {
        return parseInt(activeStep.dataset.step || '1');
    }
    return 1;
  }

  // Validate current step
  function validateStep(step) {
    switch(step) {
        case 1:
            // Check if template is selected
            const selectedTemplate = localStorage.getItem('selectedTemplate');
            if (!selectedTemplate) {
                alert('Please select a template to continue');
                return false;
            }
            return true;
        case 2:
            // Check if content is generated
            const generatedContent = document.querySelector('#generatedContent');
            if (!generatedContent || !generatedContent.value.trim()) {
                alert('Please generate content before proceeding');
                return false;
            }
            return true;
        case 3:
            // Allow customization
            return true;
        default:
            return true;
    }
  }

  // Go to specified step
  function goToStep(stepNumber) {
    // Update step indicators
    document.querySelectorAll('.step-item').forEach(step => {
        const stepNum = parseInt(step.dataset.step || '1');
        if (stepNum < stepNumber) {
            step.classList.remove('active');
            step.classList.add('completed');
        } else if (stepNum === stepNumber) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    // Show appropriate tab content
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('show', 'active');
    });
    
    const activeTab = document.querySelector(`#step${stepNumber}Content`);
    if (activeTab) {
        activeTab.classList.add('show', 'active');
    }
  }
}); 