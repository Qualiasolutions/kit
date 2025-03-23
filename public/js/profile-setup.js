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
  const steps = document.querySelectorAll('.step-content');
  const stepPills = document.querySelectorAll('.step-pill');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  const industrySelect = document.getElementById('industry-select');
  const nicheSelect = document.getElementById('niche-select');
  const customNicheToggle = document.getElementById('custom-niche-toggle');
  const customNicheContainer = document.getElementById('custom-niche-container');
  const objectiveOptions = document.querySelectorAll('.objective-option');
  const logoUpload = document.getElementById('logo-upload');
  const logoPreview = document.getElementById('logo-preview');
  const brandName = document.getElementById('brand-name');
  const primaryColorInput = document.getElementById('primary-color');
  const secondaryColorInput = document.getElementById('secondary-color');
  const accentColorInput = document.getElementById('accent-color');
  const resetColors = document.getElementById('reset-colors');
  const voiceOptions = document.querySelectorAll('.voice-option');
  const audienceOptions = document.querySelectorAll('.audience-option');
  const customAudience = document.getElementById('custom-audience');
  const platformOptions = document.querySelectorAll('.platform-option');
  
  // Constants
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
  
  // Current step tracking
  let currentStep = 0;
  
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
  setupEventListeners();
  updateProgressBar();
  
  // Highlight the active step pill
  function highlightPill(stepNumber) {
    // Reset all pills
    stepPills.forEach(pill => {
      pill.classList.remove('active');
    });
    
    // Highlight the active pill
    const activePill = document.querySelector(`.step-pill[data-step="${stepNumber + 1}"]`);
    if (activePill) {
      activePill.classList.add('active');
    }
  }
  
  function setupEventListeners() {
    // Form submission
    profileForm.addEventListener('submit', submitProfile);
    
    // Next buttons
    nextButtons.forEach(button => {
      button.addEventListener('click', goToNextStep);
    });
    
    // Previous buttons
    prevButtons.forEach(button => {
      button.addEventListener('click', goToPrevStep);
    });
    
    // Step pills for navigation
    stepPills.forEach(pill => {
      pill.addEventListener('click', function() {
        const stepIndex = parseInt(this.getAttribute('data-step')) - 1;
        goToStep(stepIndex);
      });
    });
    
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
    
    // Logo Upload
    logoUpload.addEventListener('change', function(e) {
      const file = this.files[0];
      
      if (file) {
        // Show logo preview
        const reader = new FileReader();
        
        reader.onload = function(e) {
          logoPreview.querySelector('img').src = e.target.result;
          logoPreview.classList.remove('d-none');
          
          // Simulate AI color detection
          simulateAIColorDetection();
        };
        
        reader.readAsDataURL(file);
        profileData.logo = file;
      } else {
        // Hide logo preview
        logoPreview.classList.add('d-none');
        profileData.logo = null;
      }
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
    
    // Reset to detected colors
    resetColors.addEventListener('click', function() {
      if (this.checked) {
        primaryColorInput.value = profileData.detectedColors.primary;
        secondaryColorInput.value = profileData.detectedColors.secondary;
        accentColorInput.value = profileData.detectedColors.accent;
        
        document.getElementById('primary-color-preview').style.backgroundColor = profileData.detectedColors.primary;
        document.getElementById('secondary-color-preview').style.backgroundColor = profileData.detectedColors.secondary;
        document.getElementById('accent-color-preview').style.backgroundColor = profileData.detectedColors.accent;
        
        profileData.colors = {...profileData.detectedColors};
      }
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
    
    // Audience Selection
    audienceOptions.forEach(option => {
      option.addEventListener('click', function() {
        const checkbox = this.querySelector('.audience-checkbox');
        checkbox.checked = !checkbox.checked;
        
        if (checkbox.checked) {
          this.classList.add('selected');
          
          // Check if we've reached the maximum number of audiences
          const selectedAudiences = document.querySelectorAll('.audience-checkbox:checked');
          if (selectedAudiences.length > maxSelections.audiences) {
            // Uncheck the first one if we have too many
            selectedAudiences[0].checked = false;
            selectedAudiences[0].closest('.audience-option').classList.remove('selected');
          }
        } else {
          this.classList.remove('selected');
        }
        
        // Update stored data
        profileData.audiences = Array.from(document.querySelectorAll('.audience-checkbox:checked')).map(cb => cb.closest('.audience-option').dataset.value);
      });
    });
    
    // Custom audience input
    customAudience.addEventListener('change', function() {
      profileData.customAudience = this.value;
      
      if (this.value && profileData.audiences.length < maxSelections.audiences) {
        profileData.audiences.push(this.value);
        showAlert(`Added "${this.value}" to your target audiences`, 'info');
        this.value = '';
      }
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
    const percent = ((currentStep + 1) / steps.length) * 100;
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', percent);
    
    // Update step pills
    highlightPill(currentStep);
  }
  
  // Navigate to a specific step
  function goToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length) {
      return;
    }
    
    // If trying to advance, validate the current step
    if (stepIndex > currentStep) {
      // Only validate up to the target step
      for (let i = currentStep; i < stepIndex; i++) {
        if (!validateStep(i)) {
          return;
        }
      }
    }
    
    // Hide all steps
    steps.forEach(step => {
      step.classList.add('d-none');
    });
    
    // Show the target step
    steps[stepIndex].classList.remove('d-none');
    
    // Update current step
    currentStep = stepIndex;
    
    // Update progress
    updateProgressBar();
  }
  
  // Go to next step
  function goToNextStep() {
    if (!validateStep(currentStep)) {
      return;
    }
    
    goToStep(currentStep + 1);
  }
  
  // Go to previous step
  function goToPrevStep() {
    goToStep(currentStep - 1);
  }
  
  // Validate step
  function validateStep(step) {
    switch(step) {
      case 0: // Industry & Niche
        if (!profileData.industry) {
          showAlert('Please select your industry', 'danger');
          return false;
        }
        if (!profileData.niche && !profileData.customNiche) {
          showAlert('Please select or enter your niche', 'danger');
          return false;
        }
        return true;
        
      case 1: // Objectives
        if (profileData.objectives.length === 0) {
          showAlert('Please select at least one business objective', 'danger');
          return false;
        }
        return true;
        
      case 2: // Brand Name & Logo
        if (!profileData.brandName) {
          showAlert('Please enter your brand name', 'danger');
          return false;
        }
        return true;
        
      case 4: // Voice & Style
        if (profileData.voices.length === 0) {
          showAlert('Please select at least one business voice/tone', 'danger');
          return false;
        }
        return true;
        
      case 5: // Target Audience
        if (profileData.audiences.length === 0 && !profileData.customAudience) {
          showAlert('Please select at least one target audience', 'danger');
          return false;
        }
        return true;
        
      case 6: // Social Platforms
        if (profileData.platforms.length === 0) {
          showAlert('Please select at least one social media platform', 'danger');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  }
  
  // Simulate AI color detection from logo
  function simulateAIColorDetection() {
    // In a real app, this would analyze the logo and extract colors
    // For this demo, we'll use random colors
    const randomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };
    
    // Generate colors
    const primary = randomColor();
    const secondary = randomColor();
    const accent = randomColor();
    
    // Store detected colors
    profileData.detectedColors = {
      primary,
      secondary,
      accent
    };
    
    // Update UI
    primaryColorInput.value = primary;
    secondaryColorInput.value = secondary;
    accentColorInput.value = accent;
    
    document.getElementById('primary-color-preview').style.backgroundColor = primary;
    document.getElementById('secondary-color-preview').style.backgroundColor = secondary;
    document.getElementById('accent-color-preview').style.backgroundColor = accent;
    
    // Also update current colors
    profileData.colors = {...profileData.detectedColors};
    
    // Show a notification
    showAlert('AI has detected brand colors from your logo!', 'info');
  }
  
  // Submit profile
  async function submitProfile(e) {
    e.preventDefault();
    
    // Validate all steps before submitting
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        goToStep(i);
        return;
      }
    }
    
    // Get form data
    const formData = new FormData();
    
    // Add all profile data to form
    for (const key in profileData) {
      if (key === 'colors' || key === 'detectedColors') {
        formData.append(key, JSON.stringify(profileData[key]));
      } else if (key === 'logo' && profileData[key]) {
        formData.append('logo', profileData[key]);
      } else if (Array.isArray(profileData[key])) {
        formData.append(key, JSON.stringify(profileData[key]));
      } else if (profileData[key]) {
        formData.append(key, profileData[key]);
      }
    }
    
    try {
      // Show loading state
      showAlert('Setting up your business profile...', 'info');
      
      // DEV MODE - Use localStorage instead of API
      if (devMode) {
        // Create a mock profile object for local storage
        const mockProfile = {
          industry: profileData.industry,
          niche: profileData.niche || profileData.customNiche,
          objectives: profileData.objectives,
          brandName: profileData.brandName,
          logoUploaded: !!profileData.logo,
          colors: profileData.colors,
          voices: profileData.voices,
          audiences: profileData.audiences.concat(profileData.customAudience ? [profileData.customAudience] : []),
          platforms: profileData.platforms
        };
        
        // Save to localStorage
        localStorage.setItem('businessProfile', JSON.stringify(mockProfile));
        
        // Success message
        showAlert('Business profile created successfully!', 'success');
        
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

  // Initialize to first step
  goToStep(0);
}); 