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
    : 'https://your-api-domain.com'; // Replace with your actual API URL for production

  // DOM elements
  const profileForm = document.getElementById('profile-form');
  const alertContainer = document.getElementById('alert-container');
  const progressBar = document.querySelector('.progress-bar');
  const steps = document.querySelectorAll('.step');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  const industrySelect = document.getElementById('industry');
  const nicheSelect = document.getElementById('niche');
  const logoInput = document.getElementById('logo');
  const logoPreview = document.getElementById('logo-preview');
  const primaryColorInput = document.getElementById('primary-color');
  const secondaryColorInput = document.getElementById('secondary-color');
  const accentColorInput = document.getElementById('accent-color');
  const businessVoiceCheckboxes = document.querySelectorAll('.business-voice');
  const suggestedAudiences = document.getElementById('suggested-audiences');
  const addAudienceBtn = document.getElementById('add-audience-btn');
  const customAudienceInput = document.getElementById('custom-audience');
  const selectedAudiences = document.getElementById('selected-audiences');
  const locationTypeRadios = document.querySelectorAll('.location-type');
  const locationDetails = document.getElementById('location-details');
  const socialPlatformCheckboxes = document.querySelectorAll('.social-platform');
  
  // Current step
  let currentStep = 0;
  
  // Selected audiences array
  let audiences = [];
  
  // Initialize
  updateProgressBar();
  loadIndustries();
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
    
    // Industry change
    industrySelect.addEventListener('change', loadNiches);
    
    // Logo upload
    logoInput.addEventListener('change', handleLogoUpload);
    
    // Business voice checkboxes (limit to 2)
    businessVoiceCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', limitBusinessVoiceSelection);
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
    
    // If we're on step 2 (industry) and moving to step 3 (niche), load niches
    if (currentStep === 1) {
      loadNiches();
    }
    
    // If we're on step 2 (niche) and moving to step 6 (target audience), load suggested audiences
    if (currentStep === 2) {
      loadSuggestedAudiences();
    }
    
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
        
      case 1: // Industry
        if (!industrySelect.value) {
          showAlert('Please select an industry', 'danger');
          return false;
        }
        return true;
        
      case 2: // Niche
        if (!nicheSelect.value) {
          showAlert('Please select a niche', 'danger');
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
        
        if (socialPlatforms.length === 0) {
          showAlert('Please select at least one social platform', 'danger');
          return false;
        }
        
        return true;
        
      default:
        return true;
    }
  }
  
  // Load industries
  async function loadIndustries() {
    try {
      const response = await fetch(`${API_URL}/api/profile/industries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Clear existing options except the default one
        industrySelect.innerHTML = '<option value="" selected disabled>Select an industry</option>';
        
        // Add industry options
        data.data.forEach(industry => {
          const option = document.createElement('option');
          option.value = industry.name;
          option.textContent = industry.name;
          industrySelect.appendChild(option);
        });
      } else {
        showAlert(data.error || 'Failed to load industries', 'danger');
      }
    } catch (error) {
      showAlert('Server error. Please try again later.', 'danger');
      console.error(error);
    }
  }
  
  // Load niches based on selected industry
  function loadNiches() {
    const selectedIndustry = industrySelect.value;
    
    if (!selectedIndustry) {
      return;
    }
    
    // Clear existing options except the default one
    nicheSelect.innerHTML = '<option value="" selected disabled>Select a niche</option>';
    
    // Fetch niches for the selected industry
    fetch(`${API_URL}/api/profile/industries`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Find the selected industry
        const industry = data.data.find(ind => ind.name === selectedIndustry);
        
        if (industry && industry.niches) {
          // Add niche options
          industry.niches.forEach(niche => {
            const option = document.createElement('option');
            option.value = niche.name;
            option.textContent = niche.name;
            nicheSelect.appendChild(option);
          });
        }
      } else {
        showAlert(data.error || 'Failed to load niches', 'danger');
      }
    })
    .catch(error => {
      showAlert('Server error. Please try again later.', 'danger');
      console.error(error);
    });
  }
  
  // Handle logo upload
  function handleLogoUpload(e) {
    const file = e.target.files[0];
    
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onload = function(e) {
        logoPreview.querySelector('img').src = e.target.result;
        logoPreview.classList.remove('d-none');
      };
      reader.readAsDataURL(file);
      
      // Extract colors from logo
      if (file.type.startsWith('image/')) {
        const formData = new FormData();
        formData.append('logo', file);
        
        fetch(`${API_URL}/api/branding/extract-colors`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Set color inputs
            primaryColorInput.value = data.data.primary;
            secondaryColorInput.value = data.data.secondary;
            accentColorInput.value = data.data.accent;
          }
        })
        .catch(error => {
          console.error('Error extracting colors:', error);
        });
      }
    }
  }
  
  // Limit business voice selection to 2
  function limitBusinessVoiceSelection() {
    const checked = document.querySelectorAll('.business-voice:checked');
    
    if (checked.length > 2) {
      this.checked = false;
      showAlert('You can select up to 2 business voice options', 'warning');
    }
  }
  
  // Load suggested audiences
  function loadSuggestedAudiences() {
    const selectedIndustry = industrySelect.value;
    const selectedNiche = nicheSelect.value;
    
    if (!selectedIndustry || !selectedNiche) {
      return;
    }
    
    // Clear existing suggestions
    suggestedAudiences.innerHTML = '';
    
    // Fetch suggested audiences
    fetch(`${API_URL}/api/profile/target-audiences/${selectedIndustry}/${selectedNiche}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.data.length > 0) {
        // Add audience suggestions
        data.data.forEach(audience => {
          const div = document.createElement('div');
          div.className = 'mb-2';
          div.innerHTML = `
            <div class="form-check">
              <input class="form-check-input suggested-audience" type="checkbox" value="${audience}" id="audience-${audience.replace(/\s+/g, '-').toLowerCase()}">
              <label class="form-check-label" for="audience-${audience.replace(/\s+/g, '-').toLowerCase()}">
                ${audience}
              </label>
            </div>
          `;
          suggestedAudiences.appendChild(div);
          
          // Add event listener
          const checkbox = div.querySelector('input');
          checkbox.addEventListener('change', function() {
            if (this.checked) {
              addAudience(this.value);
            } else {
              removeAudience(this.value);
            }
          });
        });
      } else {
        suggestedAudiences.innerHTML = '<p>No suggested audiences available for this niche. Please add custom audiences below.</p>';
      }
    })
    .catch(error => {
      showAlert('Server error. Please try again later.', 'danger');
      console.error(error);
    });
  }
  
  // Add custom audience
  function addCustomAudience() {
    const audience = customAudienceInput.value.trim();
    
    if (audience) {
      addAudience(audience);
      customAudienceInput.value = '';
    }
  }
  
  // Add audience to selected audiences
  function addAudience(audience) {
    if (!audiences.includes(audience)) {
      audiences.push(audience);
      updateSelectedAudiences();
    }
  }
  
  // Remove audience from selected audiences
  function removeAudience(audience) {
    const index = audiences.indexOf(audience);
    if (index !== -1) {
      audiences.splice(index, 1);
      updateSelectedAudiences();
      
      // Uncheck the corresponding checkbox if it exists
      const checkbox = document.querySelector(`.suggested-audience[value="${audience}"]`);
      if (checkbox) {
        checkbox.checked = false;
      }
    }
  }
  
  // Update selected audiences display
  function updateSelectedAudiences() {
    selectedAudiences.innerHTML = '';
    
    if (audiences.length === 0) {
      selectedAudiences.innerHTML = '<p class="text-muted mb-0">No audiences selected</p>';
      return;
    }
    
    audiences.forEach(audience => {
      const tag = document.createElement('span');
      tag.className = 'audience-tag';
      tag.innerHTML = `
        ${audience}
        <span class="remove-tag">&times;</span>
      `;
      selectedAudiences.appendChild(tag);
      
      // Add event listener to remove button
      tag.querySelector('.remove-tag').addEventListener('click', function() {
        removeAudience(audience);
      });
    });
  }
  
  // Update location fields based on location type
  function updateLocationFields() {
    const locationType = document.querySelector('input[name="locationType"]:checked').value;
    
    // Clear previous content
    locationDetails.innerHTML = '';
    
    if (locationType === 'physical') {
      locationDetails.innerHTML = `
        <div class="mb-3">
          <label class="form-label">Business Location:</label>
          <div class="row g-2">
            <div class="col-12">
              <input type="text" class="form-control" id="address" placeholder="Address">
            </div>
            <div class="col-md-4">
              <input type="text" class="form-control" id="city" placeholder="City">
            </div>
            <div class="col-md-3">
              <input type="text" class="form-control" id="state" placeholder="State">
            </div>
            <div class="col-md-2">
              <input type="text" class="form-control" id="zip" placeholder="Zip">
            </div>
            <div class="col-md-3">
              <input type="text" class="form-control" id="country" placeholder="Country">
            </div>
          </div>
        </div>
      `;
    } else if (locationType === 'service-area') {
      locationDetails.innerHTML = `
        <div class="mb-3">
          <label for="service-areas" class="form-label">Service Areas (comma separated)</label>
          <input type="text" class="form-control" id="service-areas" placeholder="New York, New Jersey, Connecticut">
          <div class="form-text">Enter the areas where you provide services</div>
        </div>
      `;
    }
    
    // Add website and contact details fields
    locationDetails.innerHTML += `
      <div class="mb-3">
        <label for="website" class="form-label">Website (optional)</label>
        <input type="url" class="form-control" id="website" placeholder="https://example.com">
      </div>
      <div class="mb-3">
        <label class="form-label">Contact Details (optional):</label>
        <div class="row g-2">
          <div class="col-md-6">
            <input type="tel" class="form-control" id="phone" placeholder="Phone Number">
          </div>
          <div class="col-md-6">
            <input type="email" class="form-control" id="contact-email" placeholder="Contact Email">
          </div>
        </div>
      </div>
    `;
    
    // Add social platform URL fields for selected platforms
    socialPlatformCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const platform = checkbox.value;
        locationDetails.innerHTML += `
          <div class="mb-3">
            <label for="${platform.toLowerCase()}-url" class="form-label">${platform} URL</label>
            <input type="url" class="form-control" id="${platform.toLowerCase()}-url" placeholder="https://${platform.toLowerCase()}.com/yourbusiness">
          </div>
        `;
      }
    });
  }
  
  // Submit profile
  async function submitProfile(e) {
    e.preventDefault();
    
    // Validate final step
    if (!validateStep(currentStep)) {
      return;
    }
    
    // Get form data
    const formData = new FormData();
    
    // Add fields to form data
    formData.append('businessName', document.getElementById('business-name').value);
    formData.append('industry', industrySelect.value);
    formData.append('niche', nicheSelect.value);
    
    // Logo
    if (logoInput.files.length > 0) {
      formData.append('logo', logoInput.files[0]);
    }
    
    // Brand colors
    const brandColors = {
      primary: primaryColorInput.value,
      secondary: secondaryColorInput.value,
      accent: accentColorInput.value
    };
    formData.append('brandColors', JSON.stringify(brandColors));
    
    // Business voice
    const selectedVoice = [];
    businessVoiceCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        selectedVoice.push(checkbox.value);
      }
    });
    formData.append('businessVoice', JSON.stringify(selectedVoice));
    
    // Target audience
    formData.append('targetAudience', JSON.stringify(audiences));
    
    // Location
    const locationType = document.querySelector('input[name="locationType"]:checked').value;
    formData.append('locationType', locationType);
    
    // Location details
    const locationDetails = {};
    
    if (locationType === 'physical') {
      locationDetails.address = document.getElementById('address').value;
      locationDetails.city = document.getElementById('city').value;
      locationDetails.state = document.getElementById('state').value;
      locationDetails.zip = document.getElementById('zip').value;
      locationDetails.country = document.getElementById('country').value;
    } else if (locationType === 'service-area') {
      locationDetails.cities = document.getElementById('service-areas').value.split(',').map(city => city.trim());
    } else {
      locationDetails.online = true;
    }
    
    formData.append('location', JSON.stringify(locationDetails));
    
    // Website
    formData.append('website', document.getElementById('website').value);
    
    // Contact details
    const contactDetails = {
      phone: document.getElementById('phone').value,
      email: document.getElementById('contact-email').value
    };
    formData.append('contactDetails', JSON.stringify(contactDetails));
    
    // Social platforms
    const selectedPlatforms = {};
    socialPlatformCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const platform = checkbox.value;
        const urlInput = document.getElementById(`${platform.toLowerCase()}-url`);
        if (urlInput) {
          selectedPlatforms[platform] = urlInput.value;
        }
      }
    });
    formData.append('socialPlatforms', JSON.stringify(selectedPlatforms));
    
    try {
      // Send request
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Show success message and redirect
        showAlert('Profile saved successfully! Redirecting to dashboard...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        showAlert(data.error || 'Failed to save profile', 'danger');
      }
    } catch (error) {
      showAlert('Server error. Please try again later.', 'danger');
      console.error(error);
    }
  }
  
  // Function to show alerts
  function showAlert(message, type) {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      const alert = document.querySelector('.alert');
      if (alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
  }
}); 