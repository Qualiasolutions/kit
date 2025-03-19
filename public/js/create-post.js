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

  // Add AI Post Generation functionality
  function initializeAIPostGeneration() {
    const generatePostBtn = document.getElementById('generate-ai-post');
    const topicInput = document.getElementById('post-topic');
    const platformSelect = document.getElementById('platform-select');
    const contentTypeSelect = document.getElementById('content-type-select');
    const toneSelect = document.getElementById('tone-select');
    const postContentTextarea = document.getElementById('post-content');
    const postTitleInput = document.getElementById('post-title');
    const hashtagsContainer = document.getElementById('hashtags-container');
    const generateHashtagsBtn = document.getElementById('generate-hashtags');
    const loadingIndicator = document.getElementById('ai-loading-indicator');
    
    if (!generatePostBtn) return; // Exit if elements don't exist
    
    // API base URL
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? '' // Empty for local development (relative path)
      : 'https://kit-lime.vercel.app';
      
    // Generate Post with AI
    generatePostBtn.addEventListener('click', async () => {
      try {
        // Validate inputs
        if (!topicInput.value || !platformSelect.value || !contentTypeSelect.value) {
          showAlert('Please provide a topic, platform, and content type', 'danger');
          return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('d-none');
        generatePostBtn.disabled = true;
        
        // Get token
        const token = localStorage.getItem('token');
        
        // If in development mode without backend, generate mock content
        if (localStorage.getItem('devMode') === 'true') {
          setTimeout(() => {
            generateMockAIContent(
              topicInput.value, 
              platformSelect.value, 
              contentTypeSelect.value, 
              toneSelect.value
            );
            
            loadingIndicator.classList.add('d-none');
            generatePostBtn.disabled = false;
          }, 1500);
          return;
        }
        
        // Send request to API
        const response = await fetch(`${API_URL}/api/posts/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            topic: topicInput.value,
            platform: platformSelect.value,
            contentType: contentTypeSelect.value,
            tone: toneSelect.value,
            includeHashtags: true
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Populate the form with generated content
          postTitleInput.value = data.data.title;
          postContentTextarea.value = data.data.content;
          
          // Display hashtags
          displayHashtags(data.data.hashtags);
          
          showAlert('Content generated successfully!', 'success');
        } else {
          showAlert(data.error || 'Failed to generate content', 'danger');
        }
      } catch (error) {
        console.error('Error generating post:', error);
        showAlert('Error generating content. Please try again.', 'danger');
      } finally {
        loadingIndicator.classList.add('d-none');
        generatePostBtn.disabled = false;
      }
    });
    
    // Generate hashtags
    if (generateHashtagsBtn) {
      generateHashtagsBtn.addEventListener('click', async () => {
        try {
          // Validate content
          if (!postContentTextarea.value) {
            showAlert('Please write some content first', 'warning');
            return;
          }
          
          // Show loading
          generateHashtagsBtn.disabled = true;
          
          // Get token
          const token = localStorage.getItem('token');
          
          // If in development mode without backend, generate mock hashtags
          if (localStorage.getItem('devMode') === 'true') {
            setTimeout(() => {
              const mockHashtags = generateMockHashtags(topicInput.value || 'social media');
              displayHashtags(mockHashtags);
              generateHashtagsBtn.disabled = false;
            }, 1000);
            return;
          }
          
          // Send request to API
          const response = await fetch(`${API_URL}/api/posts/hashtags`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              content: postContentTextarea.value,
              count: 7
            })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            // Display hashtags
            displayHashtags(data.data);
          } else {
            showAlert(data.error || 'Failed to generate hashtags', 'danger');
          }
        } catch (error) {
          console.error('Error generating hashtags:', error);
          showAlert('Error generating hashtags', 'danger');
        } finally {
          generateHashtagsBtn.disabled = false;
        }
      });
    }
    
    // Helper function to display hashtags
    function displayHashtags(hashtags) {
      if (!hashtagsContainer) return;
      
      hashtagsContainer.innerHTML = '';
      
      hashtags.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary me-2 mb-2 p-2';
        badge.textContent = tag;
        badge.style.cursor = 'pointer';
        
        // Add click to copy functionality
        badge.addEventListener('click', () => {
          const existingContent = postContentTextarea.value;
          
          // Add the hashtag to the end of the content
          if (!existingContent.includes(tag)) {
            postContentTextarea.value = existingContent + (existingContent.endsWith(' ') ? '' : ' ') + tag;
            badge.classList.add('bg-success');
            setTimeout(() => badge.classList.remove('bg-success'), 1000);
          }
        });
        
        hashtagsContainer.appendChild(badge);
      });
    }
    
    // Helper function to generate mock AI content for dev mode
    function generateMockAIContent(topic, platform, contentType, tone) {
      // Templates based on content type
      const titleTemplates = {
        post: [
          `${topic}: How to Boost Your Results`,
          `5 Ways to Master ${topic}`,
          `The Ultimate Guide to ${topic}`,
          `Transform Your ${topic} Strategy Today`,
          `Why ${topic} Matters for Your Business`
        ],
        story: [
          `Behind the Scenes: ${topic}`,
          `Quick Tips: ${topic}`,
          `${topic} Spotlight`,
          `Today's Insight: ${topic}`,
          `${topic} Update`
        ],
        reel: [
          `${topic} in 30 Seconds`,
          `Watch This Before You Try ${topic}`,
          `${topic} Hack You Need to Know`,
          `This Changed My ${topic} Strategy`,
          `${topic} Made Simple`
        ],
        carousel: [
          `5 Slides on ${topic} You Need to See`,
          `The Complete ${topic} Breakdown`,
          `${topic}: Swipe to Learn More`,
          `${topic} Tips & Tricks (Swipe)`,
          `Your ${topic} Journey Starts Here`
        ]
      };
      
      const contentTemplates = {
        post: [
          `Looking to improve your ${topic}? You're not alone. Many businesses struggle with this crucial area.
          
          Here are 3 proven strategies:
          1. Start with a clear goal in mind
          2. Measure your results consistently
          3. Adapt based on what the data tells you
          
          Want to learn more about how we can help with your ${topic} strategy? Drop a comment below or DM us!`,
          
          `Did you know that 76% of businesses are focusing more on ${topic} this year?
          
          There's a good reason why. When done right, it can transform your results and help you stand out from competitors.
          
          Here at [Your Business], we specialize in helping businesses just like yours master ${topic}.
          
          What's your biggest challenge with ${topic}? Let us know in the comments!`
        ],
        story: [
          `Quick tip on ${topic}! Always start by understanding your audience's needs first.`,
          
          `Today we're working on a new ${topic} strategy for a client. Stay tuned for the results!`
        ],
        reel: [
          `Here's what nobody tells you about ${topic}...
          
          The secret is consistency and strategic planning.
          
          Follow these steps:
          1. Set clear, measurable goals
          2. Create a content calendar
          3. Analyze performance weekly
          4. Adjust your strategy based on data
          
          Save this for later! And if you need help with your ${topic}, our team is here to support you.`,
          
          `Want to know how the pros handle ${topic}?
          
          It's not what you might think! 
          
          The key is focusing on value first, metrics second.
          
          Here's a quick breakdown:
          - Start with your audience's problems
          - Create solutions they can implement
          - Build trust before selling
          - Measure engagement, not just reach
          
          Tag someone who needs to see this!`
        ],
        carousel: [
          `The Ultimate Guide to ${topic}
          
          Slide 1: Why ${topic} matters for your business
          
          Slide 2: Common mistakes to avoid
          
          Slide 3: Our proven 3-step framework
          
          Slide 4: Results you can expect
          
          Slide 5: How to get started today
          
          Save this post for reference! And if you need expert help with ${topic}, our team is ready to assist.`,
          
          `5 MYTHS ABOUT ${topic.toUpperCase()} DEBUNKED
          
          Myth #1: It's too expensive for small businesses
          Reality: There are strategies for every budget
          
          Myth #2: Results take too long
          Reality: You can see initial improvements in 30 days
          
          Myth #3: You need to be on every platform
          Reality: Focus on 1-2 platforms where your audience is
          
          Myth #4: It's all about going viral
          Reality: Consistent engagement beats viral one-hits
          
          Myth #5: It's too complicated
          Reality: With the right guidance, anyone can succeed
          
          Which myth surprised you the most?`
        ]
      };
      
      // Select random templates
      const contentType0 = contentType.toLowerCase();
      const titleOptions = titleTemplates[contentType0] || titleTemplates.post;
      const contentOptions = contentTemplates[contentType0] || contentTemplates.post;
      
      const randomTitle = titleOptions[Math.floor(Math.random() * titleOptions.length)];
      const randomContent = contentOptions[Math.floor(Math.random() * contentOptions.length)];
      
      // Generate hashtags
      const hashtags = generateMockHashtags(topic);
      
      // Populate the form
      postTitleInput.value = randomTitle;
      postContentTextarea.value = randomContent;
      
      // Display hashtags
      displayHashtags(hashtags);
    }
    
    // Generate mock hashtags for dev mode
    function generateMockHashtags(topic) {
      const topicTag = '#' + topic.toLowerCase().replace(/\s+/g, '');
      
      const commonHashtags = [
        '#socialmedia', '#marketing', '#digitalmarketing', '#business',
        '#contentcreation', '#socialmediamarketing', '#entrepreneur',
        '#branding', '#marketingtips', '#contentcreator', '#smallbusiness',
        '#instagram', '#facebook', '#linkedin', '#tiktok'
      ];
      
      // Shuffle and select 6 random hashtags from common list
      const shuffled = [...commonHashtags].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 6);
      
      // Add the topic tag at the beginning
      return [topicTag, ...selected];
    }
  }

  // Call after page load
  document.addEventListener('DOMContentLoaded', function() {
    // Call existing initialization functions
    
    // Initialize AI post generation functionality
    initializeAIPostGeneration();
  });
}); 