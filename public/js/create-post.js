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
  const templatePreviewImage = document.getElementById('template-preview-image');
  
  // Template data - fallback if API fails
  const defaultTemplates = [
    {
      id: 'template1',
      name: 'Product Showcase',
      description: 'Perfect for highlighting features of products or services',
      type: 'product',
      thumbnailUrl: 'img/templates/promotional.jpg'
    },
    {
      id: 'template2',
      name: 'Testimonial',
      description: 'Highlight customer reviews and feedback',
      type: 'testimonial',
      thumbnailUrl: 'img/templates/event.jpg'
    },
    {
      id: 'template3',
      name: 'Industry Tip',
      description: 'Share valuable insights and tips related to your industry',
      type: 'tip',
      thumbnailUrl: 'img/templates/news.jpg'
    },
    {
      id: 'template4',
      name: 'Promotional Offer',
      description: 'Announce sales, discounts, and special offers',
      type: 'promotion',
      thumbnailUrl: 'img/templates/promotional.jpg'
    },
    {
      id: 'template5',
      name: 'Event Announcement',
      description: 'Promote upcoming events, webinars, or launches',
      type: 'event',
      thumbnailUrl: 'img/templates/event.jpg'
    },
    {
      id: 'template6',
      name: 'Company News',
      description: 'Share updates about your business or team',
      type: 'news',
      thumbnailUrl: 'img/templates/news.jpg'
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
          <img src="${template.thumbnailUrl || 'img/placeholder-template.png'}" class="card-img-top template-thumbnail" alt="${template.name}">
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
      <img src="${template.thumbnailUrl || 'img/placeholder-template.png'}" alt="${template.name}" class="preview-image img-fluid mb-3">
      <h5 class="preview-title">${template.name}</h5>
      <p class="preview-description text-muted">${template.description}</p>
    `;
    
    // Also update the template preview image in Step 2
    if (templatePreviewImage) {
      templatePreviewImage.src = template.thumbnailUrl || 'img/placeholder-template.png';
    }
    
    // Update state
    selectedTemplate = template;
    
    // Enable next button
    nextButtons[0].disabled = false;

    // Update summary
    document.getElementById('summary-template').textContent = template.name;
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
    
    if (!selectedTemplate) {
      showAlert('danger', 'Please select a template first.');
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
          templateType: selectedTemplate.type,
          templateImage: selectedTemplate.thumbnailUrl
        })
      });
      
      if (response.ok) {
        const content = await response.json();
        displayGeneratedContent(content);
      } else {
        const errorData = await response.json();
        console.error('Error generating content:', errorData);
        showAlert('warning', 'Failed to generate content from API. Using example content instead.');
        
        // Fall back to mock content
        const mockContent = generateMockContent(topic, platform, contentType, tone);
        displayGeneratedContent(mockContent);
      }
    } catch (error) {
      console.error('Error calling AI service:', error);
      showAlert('warning', 'Could not connect to the AI service. Using sample content.');
      
      // Fall back to mock content
      const mockContent = generateMockContent(topic, platform, contentType, tone);
      displayGeneratedContent(mockContent);
    } finally {
      // Hide loading indicator
      loadingIndicator.classList.add('d-none');
      generateButton.disabled = false;
    }
  }
  
  // Generate mock content (fallback if API fails)
  function generateMockContent(topic, platform, contentType, tone) {
    // Default content for different platforms
    let title = `${tone.charAt(0).toUpperCase() + tone.slice(1)} Post About ${topic}`;
    let content = '';
    let hashtags = [];
    
    // Basic content templates based on platform and tone
    if (platform === 'instagram') {
      content = `📸 Exciting news about ${topic}! Check out our latest updates. #${topic.replace(/\s+/g, '')}`;
      hashtags = ['instagram', 'socialmedia', topic.replace(/\s+/g, '')];
    } else if (platform === 'facebook') {
      content = `We're excited to share the latest about ${topic}. What do you think? Let us know in the comments!`;
      hashtags = ['facebook', topic.replace(/\s+/g, '')];
    } else if (platform === 'twitter' || platform === 'x') {
      content = `New ${topic} update! Check out what we've been working on. #${topic.replace(/\s+/g, '')}`;
      hashtags = ['twitter', topic.replace(/\s+/g, '')];
    } else if (platform === 'linkedin') {
      content = `Professional insights about ${topic} for our valued network. We'd love to hear your thoughts on this topic.`;
      hashtags = ['linkedin', 'professional', topic.replace(/\s+/g, '')];
    }
    
    // Adjust tone
    if (tone === 'professional') {
      content = `We're pleased to announce our latest developments regarding ${topic}. ${content}`;
    } else if (tone === 'humorous') {
      content = `You won't believe what happened with our ${topic}! 😂 ${content}`;
    } else if (tone === 'inspirational') {
      content = `Achieving greatness with ${topic}! Believe in the power of innovation. ${content}`;
    }
    
    // Adjust for different content types
    if (contentType === 'carousel') {
      content = `SWIPE to see more about ${topic}! ➡️\n\n${content}`;
    } else if (contentType === 'story') {
      content = `24 HOURS ONLY! ${content}`;
    } else if (contentType === 'reel') {
      content = `Watch till the end! 🎬 ${content}`;
    }
    
    // Add template type customization
    const templateType = selectedTemplate ? selectedTemplate.type : 'general';
    if (templateType === 'product') {
      content = `PRODUCT SPOTLIGHT: ${content}`;
    } else if (templateType === 'testimonial') {
      content = `CUSTOMER TESTIMONIAL: "This ${topic} changed our business!" - Happy Customer\n\n${content}`;
    } else if (templateType === 'tip') {
      content = `PRO TIP: When dealing with ${topic}, always remember to plan ahead!\n\n${content}`;
    } else if (templateType === 'promotion') {
      content = `🔥 SPECIAL OFFER 🔥\nLimited time deal on ${topic}!\n\n${content}`;
    } else if (templateType === 'event') {
      content = `📅 UPCOMING EVENT: Join us for a special ${topic} discussion!\n\n${content}`;
    } else if (templateType === 'news') {
      content = `BREAKING: Important ${topic} update you need to know!\n\n${content}`;
    }
    
    return {
      title,
      content,
      hashtags
    };
  }
  
  // Display generated content
  function displayGeneratedContent(content) {
    // Update editor fields
    document.getElementById('post-title').value = content.title || '';
    document.getElementById('post-content').value = content.content || '';
    
    // Display generated content
    const generatedContentContainer = document.getElementById('generatedContentContainer');
    generatedContentContainer.innerHTML = `
      <div class="alert alert-success">
        <h5 class="alert-heading"><i class="bi bi-check-circle me-2"></i>Content Generated!</h5>
        <p>Your AI-generated content is ready. You can edit it in the editor panel.</p>
      </div>
    `;
    
    // Display hashtags
    if (content.hashtags && content.hashtags.length > 0) {
      displayHashtags(content.hashtags);
    }
    
    // Update summary fields
    document.getElementById('summary-title').textContent = content.title || 'Your Post Title';
    document.getElementById('summary-type').textContent = document.getElementById('content-type-select').options[document.getElementById('content-type-select').selectedIndex].text;
    document.getElementById('summary-platforms').textContent = document.getElementById('platform-select').options[document.getElementById('platform-select').selectedIndex].text;
    document.getElementById('summary-created').textContent = new Date().toLocaleDateString();
  }
  
  // Generate hashtags based on content
  function generateHashtags() {
    const contentText = document.getElementById('post-content').value;
    if (!contentText.trim()) {
      showAlert('warning', 'Please generate or enter content first');
      return;
    }
    
    // Extract keywords and generate hashtags
    const keywords = extractKeywords(contentText);
    const platform = document.getElementById('platform-select').value;
    
    // Platform-specific hashtags
    let platformHashtags = [];
    if (platform === 'instagram') {
      platformHashtags = ['instagram', 'instagood', 'photooftheday'];
    } else if (platform === 'facebook') {
      platformHashtags = ['facebook', 'share'];
    } else if (platform === 'twitter') {
      platformHashtags = ['twitter', 'trending'];
    } else if (platform === 'linkedin') {
      platformHashtags = ['linkedin', 'professional', 'networking'];
    }
    
    // Combine keywords and platform hashtags
    const hashtags = [...keywords, ...platformHashtags];
    
    // Display hashtags
    displayHashtags(hashtags);
  }
  
  // Extract keywords from text for hashtags
  function extractKeywords(text) {
    const words = text.toLowerCase().split(/\s+/);
    const filteredWords = words.filter(word => 
      word.length > 4 && 
      !['about', 'after', 'again', 'before', 'could', 'every', 'first', 'would', 'should', 'their', 'there'].includes(word)
    );
    
    // Get unique words and limit to 5
    return [...new Set(filteredWords)].slice(0, 5).map(word => word.replace(/[^a-z0-9]/g, ''));
  }
  
  // Display hashtags in container
  function displayHashtags(hashtags) {
    hashtagsContainer.innerHTML = '';
    
    hashtags.forEach(tag => {
      const badge = document.createElement('span');
      badge.className = 'badge bg-primary-light text-primary me-2 mb-2';
      badge.textContent = `#${tag}`;
      hashtagsContainer.appendChild(badge);
    });
    
    // Update preview and summary
    document.getElementById('summary-title').textContent = document.getElementById('post-title').value || 'Your Post Title';
  }
  
  // Show alert message
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
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  }
  
  // Move to next step
  function nextStep() {
    if (currentStep < 3) {
      // Hide current step
      stepsTabs[currentStep - 1].classList.remove('show', 'active');
      
      // Show next step
      currentStep++;
      stepsTabs[currentStep - 1].classList.add('show', 'active');
      
      // Update indicators
      updateStepIndicators();
    }
  }
  
  // Move to previous step
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
    // Update step indicators
    stepIndicators.forEach((indicator, index) => {
      if (index < currentStep) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
    
    // Update step items
    stepItems.forEach((item, index) => {
      if (index < currentStep) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Update progress bar
    const progressPercentage = ((currentStep - 1) / 2) * 100;
    progressBar.style.width = `${progressPercentage}%`;
  }
  
  // Logout function
  function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
  
  // Setup all event listeners
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
    logoutButton.addEventListener('click', logout);
    
    // Schedule options
    document.getElementById('publish-now').addEventListener('change', function() {
      document.getElementById('schedule-options').classList.add('d-none');
      document.getElementById('summary-schedule').textContent = 'Publish immediately';
    });
    
    document.getElementById('publish-schedule').addEventListener('change', function() {
      document.getElementById('schedule-options').classList.remove('d-none');
      updateScheduleSummary();
    });
    
    // Update schedule summary when date/time changes
    document.getElementById('schedule-date').addEventListener('change', updateScheduleSummary);
    document.getElementById('schedule-time').addEventListener('change', updateScheduleSummary);
    
    // Update post status in summary
    document.getElementById('post-status').addEventListener('change', function() {
      document.getElementById('summary-status').textContent = this.options[this.selectedIndex].text;
    });
    
    // Create post button
    document.getElementById('create-post-btn').addEventListener('click', createPost);
    
    // Live preview updates
    document.getElementById('post-title').addEventListener('input', function() {
      document.getElementById('summary-title').textContent = this.value || 'Your Post Title';
    });
    
    document.getElementById('post-content').addEventListener('input', function() {
      // Update preview if needed
    });
  }
  
  // Update schedule summary
  function updateScheduleSummary() {
    const date = document.getElementById('schedule-date').value;
    const time = document.getElementById('schedule-time').value;
    
    if (date && time) {
      const scheduleDateObj = new Date(`${date}T${time}`);
      document.getElementById('summary-schedule').textContent = scheduleDateObj.toLocaleString();
      document.getElementById('post-status').value = 'scheduled';
      document.getElementById('summary-status').textContent = 'Scheduled';
    } else {
      document.getElementById('summary-schedule').textContent = 'Incomplete schedule information';
    }
  }
  
  // Create post
  async function createPost() {
    // Validate required fields
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const status = document.getElementById('post-status').value;
    
    if (!title || !content) {
      showAlert('warning', 'Please fill in both title and content fields');
      return;
    }
    
    if (!selectedTemplate) {
      showAlert('warning', 'Please select a template');
      return;
    }
    
    // Get schedule info if scheduled
    let scheduledAt = null;
    if (document.getElementById('publish-schedule').checked) {
      const date = document.getElementById('schedule-date').value;
      const time = document.getElementById('schedule-time').value;
      
      if (date && time) {
        scheduledAt = new Date(`${date}T${time}`).toISOString();
      } else if (status === 'scheduled') {
        showAlert('warning', 'Please set both date and time for scheduling');
        return;
      }
    }
    
    // Get hashtags
    const hashtagElements = hashtagsContainer.querySelectorAll('.badge');
    const hashtags = Array.from(hashtagElements).map(el => el.textContent.substring(1)); // Remove # prefix
    
    // Create post object
    const postData = {
      title,
      content,
      status,
      templateId: selectedTemplate.id,
      templateImage: selectedTemplate.thumbnailUrl,
      platform: document.getElementById('platform-select').value,
      contentType: document.getElementById('content-type-select').value,
      hashtags,
      scheduledAt
    };
    
    // Show loading
    document.getElementById('create-post-btn').disabled = true;
    document.getElementById('create-post-btn').innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating...';
    
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
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Error creating post:', errorData);
        showAlert('danger', `Failed to create post: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error calling API:', error);
      showAlert('danger', 'Could not connect to the server. Please try again.');
    } finally {
      document.getElementById('create-post-btn').disabled = false;
      document.getElementById('create-post-btn').textContent = 'Create Post';
    }
  }
  
  // Initialize the page
  init();
}); 