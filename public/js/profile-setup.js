document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Check if we're in dev mode
  const devMode = localStorage.getItem('devMode') === 'true';

  // API base URL - change this to your deployed API URL when needed
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '' // Empty for local development (relative path)
    : 'https://kit-lime.vercel.app'; // Updated with actual deployed URL

  // DOM elements
  const profileForm = document.getElementById('profile-form');
  const alertContainer = document.getElementById('alert-container');
  const progressBar = document.querySelector('.progress-bar');
  const steps = document.querySelectorAll('.step');
  const stepPills = document.querySelectorAll('.step-pill');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  const businessTypeSelect = document.getElementById('business-type');
  const logoInput = document.getElementById('logo');
  const logoPreview = document.getElementById('logo-preview');
  const primaryColorInput = document.getElementById('primary-color');
  const secondaryColorInput = document.getElementById('secondary-color');
  const accentColorInput = document.getElementById('accent-color');
  const autoColorDetection = document.getElementById('auto-color-detection');
  const aiDetectionAlert = document.getElementById('ai-detection-alert');
  const templateSelectionRadios = document.querySelectorAll('input[name="template-selection"]');
  const templateOptions = document.getElementById('template-options');
  const targetAudienceCheckboxes = document.querySelectorAll('.target-audience');
  const audienceCount = document.getElementById('audience-count');
  const addAudienceBtn = document.getElementById('add-audience-btn');
  const customAudienceInput = document.getElementById('custom-audience');
  const selectedAudiences = document.getElementById('selected-audiences');
  const locationTypeRadios = document.querySelectorAll('.location-type');
  const locationDetails = document.getElementById('location-details');
  const physicalDetails = document.getElementById('physical-details');
  const onlineDetails = document.getElementById('online-details');
  const socialPlatformCheckboxes = document.querySelectorAll('.social-platform');
  
  // Step-specific elements
  const industrySelect = document.getElementById('industry-select');
  const nicheSelect = document.getElementById('niche-select');
  const customNicheToggle = document.getElementById('custom-niche-toggle');
  const customNicheContainer = document.getElementById('custom-niche-container');
  const objectiveCheckboxes = document.querySelectorAll('.objective-checkbox');
  const objectiveOptions = document.querySelectorAll('.objective-option');
  const logoUpload = document.getElementById('logo-upload');
  const brandName = document.getElementById('brand-name');
  const voiceCheckboxes = document.querySelectorAll('.voice-checkbox');
  const voiceOptions = document.querySelectorAll('.voice-option');
  const platformCheckboxes = document.querySelectorAll('.platform-checkbox');
  const platformOptions = document.querySelectorAll('.platform-option');
  
  // Constants
  const totalSteps = steps.length;
  const maxSelections = {
    objectives: 2,
    voices: 2,
    audiences: 3
  };
  
  // Stored data
  let profileData = {
    industry: '',
    niche: '',
    customNiche: '',
    objectives: [],
    brandName: '',
    logo: null,
    colors: {
      primary: '#00897b',
      secondary: '#4db6ac',
      accent: '#e0f2f1'
    },
    detectedColors: {
      primary: '#00897b',
      secondary: '#4db6ac',
      accent: '#e0f2f1'
    },
    voices: [],
    audiences: [],
    customAudience: '',
    platforms: []
  };
  
  // Initialize current step
  let currentStep = 1;
  
  // Industry and Niche data
  const nichesByIndustry = {
    'automotive': ['Car Dealership', 'Auto Repair Shop', 'Car Rental', 'Auto Parts Store', 'Custom Car Modifications'],
    'real-estate': ['Residential Real Estate', 'Commercial Real Estate', 'Property Management', 'Interior Design', 'Home Staging'],
    'e-commerce': ['Fashion & Apparel', 'Electronics', 'Home Goods', 'Specialty Products', 'Handmade Crafts'],
    'health-wellness': ['Medical Practice', 'Wellness Center', 'Alternative Medicine', 'Mental Health', 'Nutrition'],
    'food-beverage': ['Restaurant', 'Café', 'Bakery', 'Food Truck', 'Catering Service'],
    'education': ['Private School', 'Online Courses', 'Tutoring Service', 'Language School', 'Professional Training'],
    'technology': ['IT Services', 'Software Development', 'Tech Repairs', 'Web Development', 'App Development'],
    'fashion': ['Clothing Store', 'Fashion Boutique', 'Custom Tailoring', 'Accessories', 'Footwear'],
    'beauty': ['Salon', 'Spa', 'Barber Shop', 'Nail Studio', 'Skincare Clinic'],
    'fitness': ['Gym', 'Personal Training', 'Yoga Studio', 'CrossFit Box', 'Dance Studio'],
    'finance': ['Accounting Firm', 'Financial Advisor', 'Insurance Agency', 'Tax Services', 'Investment Consulting'],
    'social-media': ['Social Media Agency', 'Content Creation', 'Influencer Marketing', 'Community Management', 'Social Media Analytics']
  };
  
  // Initialize
  updateProgressBar();
  setupEventListeners();
  
  // Setup event listeners
  function setupEventListeners() {
    // Next buttons
    nextButtons.forEach(button => {
      button.addEventListener('click', goToNextStep);
    });
    
    // Previous buttons
    prevButtons.forEach(button => {
      button.addEventListener('click', goToPrevStep);
    });
    
    // Logo upload
    logoInput.addEventListener('change', handleLogoUpload);
    
    // Auto color detection toggle
    autoColorDetection.addEventListener('change', toggleColorInputs);
    
    // Template selection radio buttons
    templateSelectionRadios.forEach(radio => {
      radio.addEventListener('change', toggleTemplateOptions);
    });
    
    // Target audience checkboxes (limit to 3)
    targetAudienceCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', handleTargetAudienceSelection);
    });
    
    // Add audience button
    addAudienceBtn.addEventListener('click', addCustomAudience);
    
    // Custom audience input (enter key)
    customAudienceInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomAudience();
      }
    });
    
    // Location type change
    locationTypeRadios.forEach(radio => {
      radio.addEventListener('change', updateLocationFields);
    });
    
    // Form submission
    profileForm.addEventListener('submit', submitProfile);
    
    // Industry and Niche Selection
    industrySelect.addEventListener('change', function() {
      const selectedIndustry = this.value;
      profileData.industry = selectedIndustry;
      
      // Clear and populate niche dropdown
      nicheSelect.innerHTML = '<option value="" selected disabled>Select your niche (based on industry)</option>';
      
      if (selectedIndustry && nichesByIndustry[selectedIndustry]) {
        nichesByIndustry[selectedIndustry].forEach(niche => {
          const option = document.createElement('option');
          option.value = niche.toLowerCase().replace(/ /g, '-');
          option.textContent = niche;
          nicheSelect.appendChild(option);
        });
        nicheSelect.disabled = false;
      } else {
        nicheSelect.disabled = true;
      }
    });
    
    nicheSelect.addEventListener('change', function() {
      profileData.niche = this.value;
    });
    
    customNicheToggle.addEventListener('change', function() {
      if (this.checked) {
        customNicheContainer.classList.remove('d-none');
        nicheSelect.disabled = true;
      } else {
        customNicheContainer.classList.add('d-none');
        nicheSelect.disabled = false;
      }
    });
    
    document.getElementById('custom-niche').addEventListener('input', function() {
      profileData.customNiche = this.value;
    });
    
    // Objective Selection
    objectiveOptions.forEach(option => {
      option.addEventListener('click', function() {
        const checkbox = this.querySelector('.objective-checkbox');
        checkbox.checked = !checkbox.checked;
        
        if (checkbox.checked) {
          this.classList.add('selected');
          
          // Check if we've reached the maximum number of objectives
          const selectedObjectives = document.querySelectorAll('.objective-checkbox:checked');
          if (selectedObjectives.length > maxSelections.objectives) {
            // Uncheck the first one if we have too many
            selectedObjectives[0].checked = false;
            selectedObjectives[0].closest('.objective-option').classList.remove('selected');
          }
        } else {
          this.classList.remove('selected');
        }
        
        // Update stored data
        profileData.objectives = Array.from(document.querySelectorAll('.objective-checkbox:checked')).map(cb => cb.closest('.objective-option').dataset.value);
      });
    });
    
    // Brand Name
    brandName.addEventListener('input', function() {
      profileData.brandName = this.value;
    });
    
    // Color Management
    primaryColorInput.addEventListener('input', function() {
      profileData.colors.primary = this.value;
      document.getElementById('primary-color-preview').style.backgroundColor = this.value;
    });
    
    secondaryColorInput.addEventListener('input', function() {
      profileData.colors.secondary = this.value;
      document.getElementById('secondary-color-preview').style.backgroundColor = this.value;
    });
    
    accentColorInput.addEventListener('input', function() {
      profileData.colors.accent = this.value;
      document.getElementById('accent-color-preview').style.backgroundColor = this.value;
    });
    
    // Voice Selection
    voiceOptions.forEach(option => {
      option.addEventListener('click', function() {
        const checkbox = this.querySelector('.voice-checkbox');
        checkbox.checked = !checkbox.checked;
        
        if (checkbox.checked) {
          this.classList.add('selected');
          
          // Check if we've reached the maximum number of voices
          const selectedVoices = document.querySelectorAll('.voice-checkbox:checked');
          if (selectedVoices.length > maxSelections.voices) {
            // Uncheck the first one if we have too many
            selectedVoices[0].checked = false;
            selectedVoices[0].closest('.voice-option').classList.remove('selected');
          }
        } else {
          this.classList.remove('selected');
        }
        
        // Update stored data
        profileData.voices = Array.from(document.querySelectorAll('.voice-checkbox:checked')).map(cb => cb.closest('.voice-option').dataset.value);
      });
    });
    
    // Platform Selection
    platformOptions.forEach(option => {
      option.addEventListener('click', function() {
        const checkbox = this.querySelector('.platform-checkbox');
        checkbox.checked = !checkbox.checked;
        
        if (checkbox.checked) {
          this.classList.add('selected');
        } else {
          this.classList.remove('selected');
        }
        
        // Update stored data
        profileData.platforms = Array.from(document.querySelectorAll('.platform-checkbox:checked')).map(cb => cb.closest('.platform-option').dataset.value);
      });
    });
  }
  
  // Update progress bar
  function updateProgressBar() {
    const percent = (currentStep / (steps.length - 1)) * 100;
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', percent);
    progressBar.textContent = `Step ${currentStep + 1} of ${steps.length}`;
  }
  
  // Go to next step
  function goToNextStep() {
    // Validate current step
    if (!validateStep(currentStep)) {
      return;
    }
    
    // Special handling for logo upload step
    if (currentStep === 2 && logoInput.files.length > 0) {
      // Show AI detection alert
      aiDetectionAlert.classList.remove('d-none');
      
      // Simulate AI color detection (would be replaced with actual API call)
      setTimeout(() => {
        // Hide AI detection alert
        aiDetectionAlert.classList.add('d-none');
        
        // Auto-detect colors from logo (simplified simulation)
        const randomColor = () => {
          const letters = '0123456789ABCDEF';
          let color = '#';
          for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
          }
          return color;
        };
        
        // Set random colors (would be replaced with actual color detection)
        primaryColorInput.value = randomColor();
        secondaryColorInput.value = randomColor();
        accentColorInput.value = randomColor();
        
        // Proceed to next step
        proceedToNextStep();
      }, 2000); // Simulate 2-second processing
      
      return;
    }
    
    // If we're on business type step and moving to template selection, load business-specific templates
    if (currentStep === 1) {
      loadBusinessTypeTemplates();
    }
    
    proceedToNextStep();
  }
  
  // Proceed to next step (called directly or after async operations)
  function proceedToNextStep() {
    // Hide current step
    steps[currentStep].classList.add('d-none');
    
    // Show next step
    currentStep++;
    steps[currentStep].classList.remove('d-none');
    
    // Update progress bar
    updateProgressBar();
    
    // Scroll to top of form
    profileForm.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Go to previous step
  function goToPrevStep() {
    // Hide current step
    steps[currentStep].classList.add('d-none');
    
    // Show previous step
    currentStep--;
    steps[currentStep].classList.remove('d-none');
    
    // Update progress bar
    updateProgressBar();
    
    // Scroll to top of form
    profileForm.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Validate step
  function validateStep(step) {
    switch(step) {
      case 0: // Business Name
        const businessName = document.getElementById('business-name').value;
        if (!businessName) {
          showAlert('Please enter your business name', 'danger');
          return false;
        }
        return true;
        
      case 1: // Business Type
        if (!businessTypeSelect.value) {
          showAlert('Please select a business type', 'danger');
          return false;
        }
        return true;
        
      case 2: // Logo Upload
        // Logo is optional, but if uploaded, validate file type
        if (logoInput.files.length > 0) {
          const file = logoInput.files[0];
          if (!file.type.match('image.*')) {
            showAlert('Please upload a valid image file', 'danger');
            return false;
          }
        }
        return true;
        
      case 5: // Business Voice
        const selectedVoice = document.querySelector('input[name="business-voice"]:checked');
        if (!selectedVoice) {
          showAlert('Please select a business voice', 'danger');
          return false;
        }
        return true;
        
      case 6: // Target Audience
        if (audiences.length === 0) {
          showAlert('Please select at least one target audience', 'danger');
          return false;
        }
        return true;
        
      case 7: // Location & Social Platforms
        const locationType = document.querySelector('input[name="locationType"]:checked');
        const socialPlatforms = document.querySelectorAll('.social-platform:checked');
        
        if (!locationType) {
          showAlert('Please select a location type', 'danger');
          return false;
        }
        
        // Validate location details based on type
        if (locationType.value === 'physical' || locationType.value === 'both') {
          const address = document.getElementById('business-address').value;
          const city = document.getElementById('business-city').value;
          if (!address || !city) {
            showAlert('Please enter your business address', 'danger');
            return false;
          }
        }
        
        if (locationType.value === 'online' || locationType.value === 'both') {
          const website = document.getElementById('business-website').value;
          if (!website) {
            showAlert('Please enter your business website', 'danger');
            return false;
          }
        }
        
        if (socialPlatforms.length === 0) {
          showAlert('Please select at least one social platform', 'danger');
          return false;
        }
        
        return true;
        
      default:
        return true;
    }
  }
  
  // Handle logo upload
  function handleLogoUpload(e) {
    const file = logoInput.files[0];
    
    if (file) {
      // Show logo preview
      const reader = new FileReader();
      
      reader.onload = function(e) {
        logoPreview.querySelector('img').src = e.target.result;
        logoPreview.classList.remove('d-none');
      };
      
      reader.readAsDataURL(file);
    } else {
      // Hide logo preview
      logoPreview.classList.add('d-none');
    }
  }
  
  // Toggle color inputs based on auto-detection checkbox
  function toggleColorInputs() {
    const isDisabled = autoColorDetection.checked;
    primaryColorInput.disabled = isDisabled;
    secondaryColorInput.disabled = isDisabled;
    accentColorInput.disabled = isDisabled;
  }
  
  // Load templates based on business type
  function loadBusinessTypeTemplates() {
    const businessType = businessTypeSelect.value;
    
    if (!businessType) return;
    
    // Clear template options
    templateOptions.innerHTML = '';
    
    // Simulate fetching templates for the selected business type
    const templates = getTemplatesForBusinessType(businessType);
    
    // Add template options
    templates.forEach((template, index) => {
      // Create template card
      const templateCard = document.createElement('div');
      templateCard.className = 'col-md-4 mb-3';
      templateCard.innerHTML = `
        <div class="card h-100">
          <img src="${template.image}" class="card-img-top" alt="${template.name}">
          <div class="card-body">
            <h6 class="card-title">${template.name}</h6>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="template" value="${template.id}" id="template-${template.id}">
              <label class="form-check-label" for="template-${template.id}">
                Select
              </label>
            </div>
          </div>
        </div>
      `;
      
      templateOptions.appendChild(templateCard);
    });
  }
  
  // Get templates for specific business type (simulated)
  function getTemplatesForBusinessType(businessType) {
    // This would be replaced with an API call in production
    const templates = [
      {
        id: 'template-1',
        name: 'Modern & Clean',
        image: 'img/templates/template-1.jpg'
      },
      {
        id: 'template-2',
        name: 'Bold & Colorful',
        image: 'img/templates/template-2.jpg'
      },
      {
        id: 'template-3',
        name: 'Minimal & Elegant',
        image: 'img/templates/template-3.jpg'
      }
    ];
    
    return templates;
  }
  
  // Toggle template options based on selection
  function toggleTemplateOptions() {
    const isManual = document.getElementById('manual-select-template').checked;
    
    if (isManual) {
      templateOptions.classList.remove('d-none');
    } else {
      templateOptions.classList.add('d-none');
    }
  }
  
  // Handle target audience selection (limit to MAX_AUDIENCES)
  function handleTargetAudienceSelection(e) {
    const checkbox = e.target;
    const audience = checkbox.value;
    
    if (checkbox.checked) {
      // Check if maximum number reached
      const selectedCount = document.querySelectorAll('.target-audience:checked').length;
      
      if (selectedCount > MAX_AUDIENCES) {
        checkbox.checked = false;
        showAlert(`You can select up to ${MAX_AUDIENCES} target audiences`, 'warning');
        return;
      }
      
      // Add to audiences array if not already there
      if (!audiences.includes(audience)) {
        audiences.push(audience);
      }
    } else {
      // Remove from audiences array
      const index = audiences.indexOf(audience);
      if (index !== -1) {
        audiences.splice(index, 1);
      }
    }
    
    updateSelectedAudiences();
  }
  
  // Add custom audience
  function addCustomAudience() {
    const audience = customAudienceInput.value.trim();
    
    if (!audience) {
      return;
    }
    
    // Check if maximum number reached
    if (audiences.length >= MAX_AUDIENCES) {
      showAlert(`You can select up to ${MAX_AUDIENCES} target audiences`, 'warning');
      return;
    }
    
    // Add to audiences array if not already there
    if (!audiences.includes(audience)) {
      audiences.push(audience);
      updateSelectedAudiences();
      customAudienceInput.value = '';
    } else {
      showAlert('This audience is already selected', 'warning');
    }
  }
  
  // Remove audience
  function removeAudience(audience) {
    // Remove from audiences array
    const index = audiences.indexOf(audience);
    if (index !== -1) {
      audiences.splice(index, 1);
    }
    
    // Uncheck corresponding checkbox if it exists
    const checkbox = document.querySelector(`.target-audience[value="${audience}"]`);
    if (checkbox) {
      checkbox.checked = false;
    }
    
    updateSelectedAudiences();
  }
  
  // Update selected audiences display
  function updateSelectedAudiences() {
    // Update counter
    audienceCount.textContent = `(${audiences.length}/${MAX_AUDIENCES})`;
    
    // Clear selected audiences container
    selectedAudiences.innerHTML = '';
    
    // Add audience tags
    audiences.forEach(audience => {
      const audienceTag = document.createElement('span');
      audienceTag.className = 'audience-tag';
      audienceTag.innerHTML = `
        ${audience}
        <span class="remove-tag" data-audience="${audience}">
          <i class="bi bi-x-circle"></i>
        </span>
      `;
      
      selectedAudiences.appendChild(audienceTag);
    });
    
    // Add remove event listeners
    document.querySelectorAll('.remove-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const audience = tag.getAttribute('data-audience');
        removeAudience(audience);
      });
    });
    
    // Show placeholder if no audiences selected
    if (audiences.length === 0) {
      selectedAudiences.innerHTML = '<span class="text-muted">No audiences selected</span>';
    }
  }
  
  // Update location fields based on selection
  function updateLocationFields() {
    const selectedLocationType = document.querySelector('input[name="locationType"]:checked');
    
    if (!selectedLocationType) {
      locationDetails.classList.add('d-none');
      return;
    }
    
    // Show location details
    locationDetails.classList.remove('d-none');
    
    // Show/hide specific details based on location type
    switch (selectedLocationType.value) {
      case 'physical':
        physicalDetails.classList.remove('d-none');
        onlineDetails.classList.add('d-none');
        break;
      case 'online':
        physicalDetails.classList.add('d-none');
        onlineDetails.classList.remove('d-none');
        break;
      case 'both':
        physicalDetails.classList.remove('d-none');
        onlineDetails.classList.remove('d-none');
        break;
    }
  }
  
  // Submit profile
  async function submitProfile(e) {
    e.preventDefault();
    
    // Validate final step (if not already validated)
    if (!validateStep(currentStep)) {
      return;
    }
    
    // Get form data
    const formData = new FormData(profileForm);
    
    // Get selected template
    const selectedTemplate = document.querySelector('input[name="template-selection"]:checked');
    if (selectedTemplate) {
      formData.append('template', selectedTemplate.value);
    }
    
    // Add target audiences
    formData.append('audiences', JSON.stringify(audiences));
    
    try {
      // Show loading state
      showAlert('Setting up your business profile...', 'info');
      
      // DEV MODE - Use localStorage instead of API
      if (devMode) {
        // Create a mock profile object
        const mockProfile = {
          businessName: formData.get('businessName'),
          industry: formData.get('businessType'),
          niche: formData.get('businessNiche') || 'General',
          description: formData.get('businessDescription'),
          brandColors: {
            primary: formData.get('primaryColor'),
            secondary: formData.get('secondaryColor'),
            accent: formData.get('accentColor')
          },
          voice: formData.get('businessVoice'),
          audiences: audiences,
          locationType: formData.get('locationType'),
          logoUploaded: logoInput.files.length > 0
        };
        
        // If logo was uploaded, use the preview as data URL
        if (logoInput.files.length > 0 && logoPreview.src) {
          mockProfile.logo = logoPreview.src;
        } else {
          mockProfile.logo = 'no-logo.png';
        }
        
        // Save to localStorage
        localStorage.setItem('mockProfile', JSON.stringify(mockProfile));
        
        // Success message
        showAlert('Business profile created successfully (Dev Mode)!', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
        
        return;
      }
      
      // PRODUCTION MODE - Only runs if devMode is false
      // Send data to API
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Show success message
        showAlert('Business profile created successfully!', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        showAlert(data.error || 'Error setting up profile', 'danger');
      }
    } catch (error) {
      showAlert('Server error. Please try again later.', 'danger');
      console.error(error);
    }
  }
  
  // Show alert
  function showAlert(message, type) {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    
    // Scroll to alert
    alertContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      const alert = alertContainer.querySelector('.alert');
      if (alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
  }
}); 