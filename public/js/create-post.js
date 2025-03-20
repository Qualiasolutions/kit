document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const stepsTabs = document.querySelectorAll('.tab-pane');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  const stepIndicators = document.querySelectorAll('.step');
  const stepItems = document.querySelectorAll('.step-item');
  const progressBar = document.querySelector('.progress-bar');
  const templateContainer = document.getElementById('templateContainer');
  const generateButton = document.getElementById('generate-ai-post');
  const loadingIndicator = document.getElementById('ai-loading-indicator');
  const generateHashtagsButton = document.getElementById('generate-hashtags');
  const hashtagsContainer = document.getElementById('hashtags-container');
  const logoutButton = document.getElementById('logout-btn');
  const alertContainer = document.querySelector('.alert-container');
  
  // Template data - fallback if API fails
  const defaultTemplates = [
    {
      id: 'template1',
      name: 'Product Showcase',
      description: 'Perfect for highlighting features of products or services',
      type: 'product',
      thumbnailUrl: 'img/templates/product-showcase.jpg'
    },
    {
      id: 'template2',
      name: 'Testimonial',
      description: 'Highlight customer reviews and feedback',
      type: 'testimonial',
      thumbnailUrl: 'img/templates/testimonial.jpg'
    },
    {
      id: 'template3',
      name: 'Industry Tip',
      description: 'Share valuable insights and tips related to your industry',
      type: 'tip',
      thumbnailUrl: 'img/templates/industry-tip.jpg'
    },
    {
      id: 'template4',
      name: 'Promotional Offer',
      description: 'Announce sales, discounts, and special offers',
      type: 'promotion',
      thumbnailUrl: 'img/templates/promo-offer.jpg'
    },
    {
      id: 'template5',
      name: 'Event Announcement',
      description: 'Promote upcoming events, webinars, or launches',
      type: 'event',
      thumbnailUrl: 'img/templates/event-announcement.jpg'
    },
    {
      id: 'template6',
      name: 'Company News',
      description: 'Share updates about your business or team',
      type: 'news',
      thumbnailUrl: 'img/templates/company-news.jpg'
    }
  ];

  // Business profile - fallback if API fails
  const defaultBusinessProfile = {
    name: "Your Business",
    industry: "Marketing Agency",
    targetAudience: "Small business owners",
    products: ["Social Media Management", "Content Creation", "SEO"],
    tone: "Professional with a friendly touch",
    description: "We help small businesses grow through effective digital marketing strategies."
  };

  // Current state
  let currentStep = 1;
  let selectedTemplate = null;
  let businessProfile = null;
  let generatedContent = null;
  let selectedPlatforms = ['instagram'];

  // Check authentication status
  function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
    }
    
    // Set token in default headers for all fetch requests
    return token;
  }
  
  // Initialize the page
  function init() {
    // Check authentication
    const token = checkAuth();
    
    // Load business profile
    loadBusinessProfile(token);
    
    // Load templates
    loadTemplates(token);
    
    // Setup event listeners
    setupEventListeners();
  }
  
  // Load business profile from API
  async function loadBusinessProfile(token) {
    try {
      const response = await fetch('/api/business-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        businessProfile = await response.json();
        updateBusinessPreview();
      } else {
        // Use default profile if API fails
        console.warn('Failed to load business profile, using default');
        businessProfile = defaultBusinessProfile;
        showAlert('warning', 'Could not load your business profile. Please create one in the Business Profile section.');
      }
    } catch (error) {
      console.error('Error loading business profile:', error);
      businessProfile = defaultBusinessProfile;
      showAlert('warning', 'Could not connect to the server. Using sample business profile data.');
    }
  }
  
  // Load templates from API
  async function loadTemplates(token) {
    try {
      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const templates = await response.json();
        renderTemplates(templates);
      } else {
        // Use default templates if API fails
        console.warn('Failed to load templates, using defaults');
        renderTemplates(defaultTemplates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      renderTemplates(defaultTemplates);
      showAlert('warning', 'Could not connect to the server. Using sample template data.');
    }
  }
  
  // Render templates in the container
  function renderTemplates(templates) {
    templateContainer.innerHTML = '';
    
    templates.forEach(template => {
      const templateCard = document.createElement('div');
      templateCard.className = 'col-md-4 mb-4';
      templateCard.innerHTML = `
        <div class="card h-100 template-card" data-template-id="${template.id}">
          <img src="${template.thumbnailUrl || 'img/placeholder-template.jpg'}" class="card-img-top" alt="${template.name}">
          <div class="card-body">
            <h5 class="card-title">${template.name}</h5>
            <p class="card-text text-muted">${template.description}</p>
          </div>
          <div class="card-footer bg-transparent border-0">
            <button class="btn btn-primary btn-sm w-100 select-template-btn">Select</button>
          </div>
        </div>
      `;
      
      templateContainer.appendChild(templateCard);
      
      // Add click event to the select button
      const selectButton = templateCard.querySelector('.select-template-btn');
      selectButton.addEventListener('click', () => {
        selectTemplate(template);
      });
    });
  }
  
  // Select a template
  function selectTemplate(template) {
    // Update UI to show selected template
    document.querySelectorAll('.template-card').forEach(card => {
      card.classList.remove('border-primary');
    });
    
    const selectedCard = document.querySelector(`[data-template-id="${template.id}"]`);
    if (selectedCard) {
      selectedCard.classList.add('border-primary');
    }
    
    // Update preview
    document.querySelector('#templatePreview').innerHTML = `
      <img src="${template.thumbnailUrl || 'img/placeholder-template.jpg'}" alt="${template.name}" class="preview-image img-fluid mb-3">
      <h5 class="preview-title">${template.name}</h5>
      <p class="preview-description text-muted">${template.description}</p>
    `;
    
    // Update state
    selectedTemplate = template;
    
    // Enable next button
    nextButtons[0].disabled = false;
  }
  
  // Update business profile preview
  function updateBusinessPreview() {
    if (businessProfile) {
      document.querySelectorAll('.business-name').forEach(element => {
        element.textContent = businessProfile.name;
      });
      
      // Update other business elements if needed
    }
  }
  
  // Generate AI content
  async function generateAIContent() {
    if (!businessProfile) {
      showAlert('danger', 'Please create a business profile first.');
      return;
    }
    
    const topic = document.getElementById('post-topic').value.trim();
    const platform = document.getElementById('platform-select').value;
    const contentType = document.getElementById('content-type-select').value;
    const tone = document.getElementById('tone-select').value;
    
    if (!topic || !platform || !contentType) {
      showAlert('warning', 'Please fill out all required fields.');
      return;
    }
    
    // Show loading indicator
    loadingIndicator.classList.remove('d-none');
    generateButton.disabled = true;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic,
          platform,
          contentType,
          tone,
          businessProfile,
          templateType: selectedTemplate ? selectedTemplate.type : 'general'
        })
      });
      
      if (response.ok) {
        generatedContent = await response.json();
        displayGeneratedContent(generatedContent);
      } else {
        // Handle API error
        const error = await response.json();
        console.error('Generation failed:', error);
        showAlert('danger', 'Failed to generate content: ' + (error.message || 'Server error'));
        // Fall back to mock content
        generateMockContent(topic, platform, contentType, tone);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      showAlert('danger', 'Failed to connect to the AI service. Using sample content instead.');
      // Fall back to mock content
      generateMockContent(topic, platform, contentType, tone);
    } finally {
      // Hide loading indicator
      loadingIndicator.classList.add('d-none');
      generateButton.disabled = false;
    }
  }
  
  // Generate mock AI content as fallback
  function generateMockContent(topic, platform, contentType, tone) {
    console.log('Generating mock content with:', { topic, platform, contentType, tone });
    
    // Sample content templates based on type
    const contentTemplates = {
      post: {
        title: `Top Tips for ${topic}`,
        content: `Looking to improve your ${topic}? Here are some expert tips from our team at ${businessProfile.name}!\n\n1. Start with a clear strategy\n2. Understand your target audience\n3. Create consistent, high-quality content\n4. Engage with your followers regularly\n\nWhat challenges do you face with ${topic}? Let us know in the comments!`,
        hashtags: [`#${topic.replace(/\s+/g, '')}`, `#${businessProfile.industry.replace(/\s+/g, '')}`, '#tips', '#strategy', '#growth']
      },
      carousel: {
        title: `${topic} Guide: Swipe for Expert Tips`,
        content: `📊 Our ${topic} guide is here! Swipe through for expert insights.\n\nSlide 1: Understanding ${topic}\nSlide 2: Key strategies for success\nSlide 3: Tools that can help\nSlide 4: Common mistakes to avoid\nSlide 5: How ${businessProfile.name} can help\n\nSave this post for later reference!`,
        hashtags: [`#${topic.replace(/\s+/g, '')}`, '#guide', '#expertadvice', '#swiperight', '#savethispost']
      },
      story: {
        title: `Quick ${topic} Tip`,
        content: `Did you know?\n\n${businessProfile.name}'s quick tip for ${topic}:\n\nFocus on consistency rather than perfection. Start small, be regular with your efforts, and gradually scale up as you learn what works for your audience.`,
        hashtags: [`#${topic.replace(/\s+/g, '')}`, '#quicktip', '#didyouknow']
      },
      reel: {
        title: `${topic} in 60 Seconds`,
        content: `🎬 ${topic.toUpperCase()} IN 60 SECONDS 🎬\n\nHere's everything you need to know about ${topic} in just one minute!\n\n- Point 1: Start with research\n- Point 2: Create a plan\n- Point 3: Execute consistently\n- Point 4: Measure results\n- Point 5: Adjust and improve\n\nFollow ${businessProfile.name} for more quick tips!`,
        hashtags: [`#${topic.replace(/\s+/g, '')}`, '#60seconds', '#learnontiktok', '#quicktips']
      }
    };
    
    // Get the appropriate template
    const template = contentTemplates[contentType] || contentTemplates.post;
    
    // Adapt tone if specified
    let content = template.content;
    if (tone === 'professional') {
      content = content.replace(/!+/g, '.').replace(/\?+/g, '?');
    } else if (tone === 'casual') {
      content = content.replace(/\./g, '!').replace(/Did you know\?/g, 'Hey! Did you know?');
    } else if (tone === 'humorous') {
      content = `😂 ${content} (And yes, we're serious about this, even though we're making you smile!)`;
    }
    
    // Create mock AI response
    generatedContent = {
      title: template.title,
      content: content,
      hashtags: template.hashtags
    };
    
    displayGeneratedContent(generatedContent);
  }
  
  // Display generated content in the UI
  function displayGeneratedContent(content) {
    // Display in editor
    document.getElementById('post-title').value = content.title || '';
    document.getElementById('post-content').value = content.content || '';
    
    // Display hashtags
    displayHashtags(content.hashtags || []);
    
    // Update preview
    document.getElementById('preview-caption').textContent = content.content || '';
    
    // Show generated content
    const generatedContentContainer = document.getElementById('generatedContentContainer');
    generatedContentContainer.innerHTML = `
      <div class="alert alert-success">
        <h5 class="alert-heading"><i class="bi bi-check-circle-fill me-2"></i>Content Generated Successfully</h5>
        <p>Your AI-generated content is ready! You can now customize it in the editor.</p>
      </div>
    `;
    
    // Update summary
    document.getElementById('summary-title').textContent = content.title || 'Untitled';
    document.getElementById('summary-type').textContent = document.getElementById('content-type-select').options[document.getElementById('content-type-select').selectedIndex].text;
    document.getElementById('summary-template').textContent = selectedTemplate ? selectedTemplate.name : 'Standard';
    document.getElementById('summary-created').textContent = new Date().toLocaleDateString();
  }
  
  // Generate and display hashtags
  function generateHashtags() {
    const postContent = document.getElementById('post-content').value.trim();
    
    if (!postContent) {
      showAlert('warning', 'Please generate or enter post content first.');
      return;
    }
    
    // Extract keywords from content
    const keywords = extractKeywords(postContent);
    
    // Convert keywords to hashtags
    const hashtags = keywords.map(keyword => `#${keyword.replace(/\s+/g, '')}`);
    
    // Add some generic hashtags based on business profile
    if (businessProfile) {
      if (businessProfile.industry) {
        hashtags.push(`#${businessProfile.industry.replace(/\s+/g, '')}`);
      }
      
      if (businessProfile.products && businessProfile.products.length > 0) {
        const productHashtag = `#${businessProfile.products[0].replace(/\s+/g, '')}`;
        if (!hashtags.includes(productHashtag)) {
          hashtags.push(productHashtag);
        }
      }
    }
    
    // Add platform-specific hashtags
    const platform = document.getElementById('platform-select').value;
    if (platform === 'instagram') {
      hashtags.push('#instagood', '#instadaily');
    } else if (platform === 'twitter') {
      hashtags.push('#trending');
    } else if (platform === 'linkedin') {
      hashtags.push('#networking', '#business');
    }
    
    // Display hashtags
    displayHashtags(hashtags);
  }
  
  // Extract keywords from text
  function extractKeywords(text) {
    // Simple keyword extraction (in a real app, this would be more sophisticated)
    const words = text.split(/\s+/);
    const commonWords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'with', 'for', 'to', 'of', 'is', 'are'];
    
    // Filter out common words and keep words longer than 3 characters
    const keywords = words
      .filter(word => word.length > 3 && !commonWords.includes(word.toLowerCase()))
      .map(word => word.replace(/[^a-zA-Z0-9]/g, ''));
    
    // Remove duplicates and limit to 5 keywords
    return [...new Set(keywords)].slice(0, 5);
  }
  
  // Display hashtags in the container
  function displayHashtags(hashtags) {
    hashtagsContainer.innerHTML = '';
    
    hashtags.forEach(hashtag => {
      const badge = document.createElement('span');
      badge.className = 'badge bg-light text-primary';
      badge.textContent = hashtag;
      
      hashtagsContainer.appendChild(badge);
    });
    
    // Update preview
    document.getElementById('preview-hashtags').textContent = hashtags.join(' ');
  }
  
  // Show an alert message
  function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 150);
    }, 5000);
  }
  
  // Navigate to next step
  function nextStep() {
    if (currentStep < 4) {
      // Hide current step
      stepsTabs[currentStep - 1].classList.remove('show', 'active');
      
      // Show next step
      currentStep++;
      stepsTabs[currentStep - 1].classList.add('show', 'active');
      
      // Update indicators
      updateStepIndicators();
    }
  }
  
  // Navigate to previous step
  function prevStep() {
    if (currentStep > 1) {
      // Hide current step
      stepsTabs[currentStep - 1].classList.remove('show', 'active');
      
      // Show previous step
      currentStep--;
      stepsTabs[currentStep - 1].classList.add('show', 'active');
      
      // Update indicators
      updateStepIndicators();
    }
  }
  
  // Update step indicators
  function updateStepIndicators() {
    // Update step numbers
    stepIndicators.forEach((indicator, index) => {
      if (index + 1 === currentStep) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
    
    // Update step items
    stepItems.forEach((item, index) => {
      if (index + 1 === currentStep) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Update progress bar
    const progress = ((currentStep - 1) / 3) * 100;
    progressBar.style.width = `${progress}%`;
  }
  
  // Handle logout
  function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Next buttons
    nextButtons.forEach(button => {
      button.addEventListener('click', nextStep);
    });
    
    // Previous buttons
    prevButtons.forEach(button => {
      button.addEventListener('click', prevStep);
    });
    
    // Generate content button
    generateButton.addEventListener('click', generateAIContent);
    
    // Generate hashtags button
    generateHashtagsButton.addEventListener('click', generateHashtags);
    
    // Logout button
    if (logoutButton) {
      logoutButton.addEventListener('click', logout);
    }
    
    // Platform select buttons
    document.querySelectorAll('.platform-btn').forEach(button => {
      button.addEventListener('click', () => {
        const platform = button.dataset.platform;
        
        if (button.classList.contains('active')) {
          // Don't allow deselecting the last platform
          if (selectedPlatforms.length > 1) {
            button.classList.remove('active');
            selectedPlatforms = selectedPlatforms.filter(p => p !== platform);
          }
        } else {
          button.classList.add('active');
          selectedPlatforms.push(platform);
        }
        
        // Update selected platforms display
        updateSelectedPlatforms();
      });
    });
    
    // Schedule option
    document.getElementById('publish-schedule').addEventListener('change', function() {
      document.getElementById('schedule-options').classList.remove('d-none');
    });
    
    document.getElementById('publish-now').addEventListener('change', function() {
      document.getElementById('schedule-options').classList.add('d-none');
    });
    
    // Create post button
    document.getElementById('create-post-btn').addEventListener('click', createPost);
    
    // Post content changes
    document.getElementById('post-content').addEventListener('input', function() {
      document.getElementById('preview-caption').textContent = this.value;
    });
    
    // Post title changes
    document.getElementById('post-title').addEventListener('input', function() {
      document.getElementById('summary-title').textContent = this.value || 'Untitled';
    });
    
    // Image upload preview
    document.getElementById('upload-image-btn').addEventListener('click', function() {
      const fileInput = document.getElementById('image-upload');
      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById('preview-image').src = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
      }
    });
  }
  
  // Update selected platforms
  function updateSelectedPlatforms() {
    const platformsContainer = document.querySelector('.selected-platforms');
    platformsContainer.innerHTML = '';
    
    selectedPlatforms.forEach(platform => {
      const badge = document.createElement('span');
      badge.className = 'badge bg-primary me-1';
      badge.textContent = platform.charAt(0).toUpperCase() + platform.slice(1);
      platformsContainer.appendChild(badge);
    });
    
    // Update summary
    document.getElementById('summary-platforms').textContent = selectedPlatforms
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(', ');
  }
  
  // Create post
  async function createPost() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    
    if (!title || !content) {
      showAlert('warning', 'Please provide a title and content for your post.');
      return;
    }
    
    // Get status
    const status = document.getElementById('post-status').value;
    
    // Get schedule
    let scheduledDate = null;
    if (document.getElementById('publish-schedule').checked) {
      const date = document.getElementById('schedule-date').value;
      const time = document.getElementById('schedule-time').value;
      if (date && time) {
        scheduledDate = new Date(`${date}T${time}`);
      }
    }
    
    // Prepare post data
    const postData = {
      title,
      content,
      platforms: selectedPlatforms,
      templateId: selectedTemplate ? selectedTemplate.id : null,
      status,
      scheduledDate: scheduledDate ? scheduledDate.toISOString() : null,
      hashtags: Array.from(hashtagsContainer.children).map(el => el.textContent)
    };
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });
      
      if (response.ok) {
        showAlert('success', 'Post created successfully!');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 2000);
      } else {
        const error = await response.json();
        showAlert('danger', 'Failed to create post: ' + (error.message || 'Server error'));
      }
    } catch (error) {
      console.error('Error creating post:', error);
      showAlert('danger', 'Could not connect to the server. Please try again later.');
    }
  }
  
  // Initialize the page
  init();
}); 