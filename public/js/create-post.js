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
  if (!profileComplete) {
    showAlert('Please complete your business profile first.', 'warning');
    // Redirect to profile setup after a delay
    setTimeout(() => {
      window.location.href = 'profile-setup.html';
    }, 2000);
    return;
  }

  // API base URL - change this to your deployed API URL when needed
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '' // Empty for local development (relative path)
    : 'https://kit-lime.vercel.app'; // Updated with actual deployed URL

  // DOM elements
  const postForm = document.getElementById('post-form');
  const postType = document.getElementById('post-type');
  const templateSelect = document.getElementById('template');
  const platformsContainer = document.getElementById('platforms-container');
  const postContent = document.getElementById('post-content');
  const postHashtags = document.getElementById('post-hashtags');
  const generateHashtagsBtn = document.getElementById('generate-hashtags-btn');
  const postImage = document.getElementById('post-image');
  const imageEditorControls = document.getElementById('image-editor-controls');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const resetImageBtn = document.getElementById('reset-image-btn');
  const removeBackgroundBtn = document.getElementById('remove-bg-btn');
  const enhanceImageBtn = document.getElementById('enhance-image-btn');
  const imageBrightness = document.getElementById('image-brightness');
  const imageContrast = document.getElementById('image-contrast');
  const postDate = document.getElementById('post-date');
  const scheduleOptimalTime = document.getElementById('schedule-optimal-time');
  const contentTopic = document.getElementById('content-topic');
  const contentTone = document.getElementById('content-tone');
  const contentGoal = document.getElementById('content-goal');
  const generateContentBtn = document.getElementById('generate-content-btn');
  const savePostBtn = document.getElementById('save-post-btn');
  const autoResize = document.getElementById('auto-resize');
  const autoCaption = document.getElementById('auto-caption');
  const platformPreviewButtons = document.querySelectorAll('[data-platform]');
  
  // Brand profile elements
  const businessNameDisplay = document.getElementById('business-name-display');
  const businessTypeDisplay = document.getElementById('business-type-display');
  const businessLogoDisplay = document.getElementById('business-logo-display').querySelector('img');
  const primaryColorDisplay = document.getElementById('primary-color-display');
  const secondaryColorDisplay = document.getElementById('secondary-color-display');
  const accentColorDisplay = document.getElementById('accent-color-display');
  
  // Preview elements
  const previewUsername = document.getElementById('preview-username');
  const previewUsernameCaption = document.getElementById('preview-username-caption');
  const previewCaption = document.getElementById('preview-caption');
  const previewHashtags = document.getElementById('preview-hashtags');
  
  // Business profile data
  let businessProfile = mockProfile || null;
  
  // Original image data (for reset)
  let originalImageData = null;
  
  // Set default date to tomorrow at current time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  postDate.value = tomorrow.toISOString().slice(0, 16);

  // Initialize
  if (!devMode) {
    loadBusinessProfile();
  } else {
    // If in dev mode, use the mock profile
    applyBusinessProfile();
    loadPlatforms();
    setContentTone();
  }
  
  setupEventListeners();
  
  // Setup event listeners
  function setupEventListeners() {
    // Post type change
    postType.addEventListener('change', loadTemplates);
    
    // Template change
    templateSelect.addEventListener('change', applyTemplate);
    
    // Generate hashtags
    generateHashtagsBtn.addEventListener('click', generateHashtags);
    
    // Image upload
    postImage.addEventListener('change', handleImageUpload);
    
    // Image adjustments
    resetImageBtn.addEventListener('click', resetImage);
    removeBackgroundBtn.addEventListener('click', removeBackground);
    enhanceImageBtn.addEventListener('click', enhanceImage);
    imageBrightness.addEventListener('input', applyImageAdjustments);
    imageContrast.addEventListener('input', applyImageAdjustments);
    
    // Content generation
    generateContentBtn.addEventListener('click', generateContent);
    
    // Platform preview buttons
    platformPreviewButtons.forEach(button => {
      button.addEventListener('click', switchPlatformPreview);
    });
    
    // Post content change (for preview)
    postContent.addEventListener('input', updatePreview);
    postHashtags.addEventListener('input', updatePreview);
    
    // Save post
    savePostBtn.addEventListener('click', savePost);
  }

  // Load business profile
  async function loadBusinessProfile() {
    try {
      // Skip API call in dev mode
      if (devMode) {
        businessProfile = mockProfile;
        applyBusinessProfile();
        loadPlatforms();
        setContentTone();
        return;
      }
      
      // Regular API call for production mode
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        businessProfile = data.data;
        
        // Apply business profile to UI
        applyBusinessProfile();
        
        // Load platforms from profile
        loadPlatforms();
        
        // Set content tone based on business voice
        setContentTone();
      } else {
        showAlert(data.error || 'Failed to load business profile', 'danger');
      }
    } catch (error) {
      console.error('Error loading business profile:', error);
      showAlert('Server error. Please try again later.', 'danger');
    }
  }
  
  // Apply business profile to UI
  function applyBusinessProfile() {
    if (!businessProfile) return;
    
    // Set business name and type
    businessNameDisplay.textContent = businessProfile.businessName;
    businessTypeDisplay.textContent = devMode ? businessProfile.industry : businessProfile.businessType;
    
    // Set business logo if available
    if (devMode && businessProfile.logo) {
      businessLogoDisplay.src = businessProfile.logo;
    } else if (businessProfile.logoUrl) {
      businessLogoDisplay.src = businessProfile.logoUrl;
    }
    
    // Set brand colors
    if (devMode && businessProfile.brandColors) {
      primaryColorDisplay.style.backgroundColor = businessProfile.brandColors.primary;
      secondaryColorDisplay.style.backgroundColor = businessProfile.brandColors.secondary;
      accentColorDisplay.style.backgroundColor = businessProfile.brandColors.accent;
    } else {
      primaryColorDisplay.style.backgroundColor = businessProfile.primaryColor;
      secondaryColorDisplay.style.backgroundColor = businessProfile.secondaryColor;
      accentColorDisplay.style.backgroundColor = businessProfile.accentColor;
    }
    
    // Set preview username
    previewUsername.textContent = businessProfile.businessName.toLowerCase().replace(/\s+/g, '');
    previewUsernameCaption.textContent = previewUsername.textContent;
  }
  
  // Load platforms from profile
  function loadPlatforms() {
    if (!businessProfile || !businessProfile.socialPlatforms) return;
    
    // Clear platforms container
    platformsContainer.innerHTML = '';
    
    // Add platform checkboxes
    businessProfile.socialPlatforms.forEach(platform => {
      const div = document.createElement('div');
      div.className = 'form-check mb-2';
      div.innerHTML = `
        <input class="form-check-input platform-checkbox" type="checkbox" value="${platform}" id="platform-${platform.toLowerCase()}">
        <label class="form-check-label" for="platform-${platform.toLowerCase()}">${platform}</label>
      `;
      platformsContainer.appendChild(div);
    });
    
    // If no platforms, show message
    if (businessProfile.socialPlatforms.length === 0) {
      platformsContainer.innerHTML = '<p class="text-muted">No social platforms configured in your business profile.</p>';
    }
  }
  
  // Set content tone based on business voice
  function setContentTone() {
    if (!businessProfile || !businessProfile.businessVoice) return;
    
    // Clear content tone options
    contentTone.innerHTML = '';
    
    // Add tones based on business voice
    const tones = [
      { value: 'professional', label: 'Professional' },
      { value: 'casual', label: 'Casual' },
      { value: 'friendly', label: 'Friendly' },
      { value: 'humorous', label: 'Humorous' },
      { value: 'inspirational', label: 'Inspirational' }
    ];
    
    // Add options
    tones.forEach(tone => {
      const option = document.createElement('option');
      option.value = tone.value;
      option.textContent = tone.label;
      contentTone.appendChild(option);
    });
    
    // Set default tone based on business voice
    if (businessProfile.businessVoice.includes('Professional')) {
      contentTone.value = 'professional';
    } else if (businessProfile.businessVoice.includes('Trendy')) {
      contentTone.value = 'casual';
    } else if (businessProfile.businessVoice.includes('Bold')) {
      contentTone.value = 'humorous';
    } else if (businessProfile.businessVoice.includes('Minimalist')) {
      contentTone.value = 'professional';
    }
  }
  
  // Load templates based on post type
  function loadTemplates() {
    const selectedPostType = postType.value;
    
    if (!selectedPostType) return;
    
    // Clear template options
    templateSelect.innerHTML = '<option value="" selected disabled>Select a template</option>';
    
    // Get templates for post type and business type
    const templates = getTemplates(selectedPostType);
    
    // Add templates to select
    templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = template.name;
      templateSelect.appendChild(option);
    });
  }
  
  // Get templates for post type and business type
  function getTemplates(postType) {
    // This would be replaced with an API call in production
    // For now, return sample templates
    const templates = {
      text: [
        { id: 'text-1', name: 'Simple Text Post' },
        { id: 'text-2', name: 'Question & Answer' },
        { id: 'text-3', name: 'Tips & Tricks' }
      ],
      image: [
        { id: 'image-1', name: 'Product Showcase' },
        { id: 'image-2', name: 'Testimonial with Image' },
        { id: 'image-3', name: 'Quote on Image' }
      ],
      carousel: [
        { id: 'carousel-1', name: 'Before & After' },
        { id: 'carousel-2', name: 'Step-by-Step Guide' },
        { id: 'carousel-3', name: 'Product Features' }
      ],
      video: [
        { id: 'video-1', name: 'Product Demo' },
        { id: 'video-2', name: 'Customer Testimonial' },
        { id: 'video-3', name: 'Behind the Scenes' }
      ]
    };
    
    return templates[postType] || [];
  }
  
  // Apply template
  function applyTemplate() {
    const selectedTemplate = templateSelect.value;
    
    if (!selectedTemplate) return;
    
    // Get template content
    const templateContent = getTemplateContent(selectedTemplate);
    
    // Apply template content to post
    if (templateContent.text) {
      postContent.value = templateContent.text;
    }
    
    if (templateContent.hashtags) {
      postHashtags.value = templateContent.hashtags;
    }
    
    // Update preview
    updatePreview();
  }
  
  // Get template content
  function getTemplateContent(templateId) {
    // This would be replaced with an API call in production
    // For now, return sample content
    const businessTypeHashtag = businessProfile && businessProfile.businessType 
      ? '#' + businessProfile.businessType.replace(/\s+/g, '') 
      : '#business';
    
    const templateContent = {
      'text-1': {
        text: "Looking for [product/service]? We've got you covered! Our [business name] offers [key benefit]. Visit us today!",
        hashtags: businessTypeHashtag + " #local"
      },
      'text-2': {
        text: "Q: [Common question about your product/service]?\n\nA: [Your answer that highlights benefits]",
        hashtags: "#FAQ " + businessTypeHashtag
      },
      'text-3': {
        text: "📝 Top 3 Tips for [topic related to your business]:\n\n1. [Tip 1]\n2. [Tip 2]\n3. [Tip 3]",
        hashtags: "#tips " + businessTypeHashtag
      },
      'image-1': {
        text: "Introducing our [product name] - [brief description]. Perfect for [target audience]!",
        hashtags: "#new " + businessTypeHashtag
      },
      'image-2': {
        text: "\"[Testimonial quote]\" - [Customer name]\n\nWe love hearing from our happy customers!",
        hashtags: "#testimonial " + businessTypeHashtag
      },
      'image-3': {
        text: "\"[Inspirational quote relevant to your business]\"",
        hashtags: "#quote #inspiration"
      }
    };
    
    return templateContent[templateId] || { text: '', hashtags: '' };
  }
  
  // Generate hashtags
  async function generateHashtags() {
    if (!businessProfile) {
      showAlert('Business profile is required to generate hashtags', 'warning');
      return;
    }
    
    const content = postContent.value.trim();
    
    if (!content) {
      showAlert('Please enter post content before generating hashtags', 'warning');
      return;
    }
    
    // Show loading state
    generateHashtagsBtn.disabled = true;
    generateHashtagsBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
    
    try {
      // In a real implementation, this would call an API
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate hashtags based on business profile and content
      const hashtags = generateHashtagsBasedOnProfile(content);
      
      // Set hashtags
      postHashtags.value = hashtags;
      
      // Update preview
      updatePreview();
      
      // Restore button
      generateHashtagsBtn.disabled = false;
      generateHashtagsBtn.innerHTML = '<i class="bi bi-magic"></i> Generate Hashtags';
    } catch (error) {
      console.error('Error generating hashtags:', error);
      showAlert('Failed to generate hashtags. Please try again.', 'danger');
      
      // Restore button
      generateHashtagsBtn.disabled = false;
      generateHashtagsBtn.innerHTML = '<i class="bi bi-magic"></i> Generate Hashtags';
    }
  }
  
  // Generate hashtags based on business profile and content
  function generateHashtagsBasedOnProfile(content) {
    if (!businessProfile) return '';
    
    // Create hashtags based on business type, location, and target audience
    const hashtags = [];
    
    // Add business type hashtag
    if (businessProfile.businessType) {
      hashtags.push(`#${businessProfile.businessType.replace(/\s+/g, '')}`);
    }
    
    // Add location hashtag if available
    if (businessProfile.locationType === 'physical' && businessProfile.city) {
      hashtags.push(`#${businessProfile.city.replace(/\s+/g, '')}`);
    }
    
    // Add audience hashtags
    if (businessProfile.targetAudiences && businessProfile.targetAudiences.length > 0) {
      businessProfile.targetAudiences.forEach(audience => {
        // Convert audience to hashtag format
        const audienceTag = audience.split(' ')[0].toLowerCase();
        hashtags.push(`#${audienceTag}`);
      });
    }
    
    // Add some generic hashtags based on post content
    const keywords = ['tips', 'new', 'sale', 'offer', 'best', 'quality', 'service', 'customer'];
    keywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) {
        hashtags.push(`#${keyword}`);
      }
    });
    
    // Randomize a bit to ensure variety
    const shuffled = hashtags.sort(() => 0.5 - Math.random());
    
    // Take only up to 8 hashtags
    return shuffled.slice(0, 8).join(' ');
  }
  
  // Handle image upload
  function handleImageUpload(e) {
    const file = e.target.files[0];
    
    if (!file) {
      imageEditorControls.classList.add('d-none');
      imagePreviewContainer.classList.add('d-none');
      return;
    }
    
    if (!file.type.match('image.*')) {
      showAlert('Please upload a valid image file', 'danger');
      return;
    }
    
    // Show image editor controls
    imageEditorControls.classList.remove('d-none');
    
    // Read and display image
    const reader = new FileReader();
    reader.onload = function(e) {
      // Store original image for reset
      originalImageData = e.target.result;
      
      // Display image
      imagePreview.src = e.target.result;
      imagePreviewContainer.classList.remove('d-none');
      
      // Reset adjustments
      imageBrightness.value = 100;
      imageContrast.value = 100;
      
      // Update preview
      updatePreview();
    };
    reader.readAsDataURL(file);
  }
  
  // Reset image to original
  function resetImage() {
    if (!originalImageData) return;
    
    // Reset image to original
    imagePreview.src = originalImageData;
    
    // Reset adjustment sliders
    imageBrightness.value = 100;
    imageContrast.value = 100;
    
    // Update preview
    updatePreview();
  }
  
  // Remove background (simulate AI background removal)
  function removeBackground() {
    removeBackgroundBtn.disabled = true;
    removeBackgroundBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
    // In a real implementation, this would call an API for background removal
    // For now, simulate API call
    setTimeout(() => {
      // For demo, we can't actually remove the background
      // but in production this would call an AI service
      showAlert('Background removal applied (simulated)', 'success');
      
      // Restore button
      removeBackgroundBtn.disabled = false;
      removeBackgroundBtn.innerHTML = '<i class="bi bi-eraser"></i> Remove Background';
    }, 1500);
  }
  
  // Enhance image (simulate AI enhancement)
  function enhanceImage() {
    enhanceImageBtn.disabled = true;
    enhanceImageBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
    // In a real implementation, this would call an API for image enhancement
    // For now, simulate API call
    setTimeout(() => {
      // For demo, we can't actually enhance the image
      // but in production this would call an AI service
      showAlert('Image enhancement applied (simulated)', 'success');
      
      // Apply some adjustments to simulate enhancement
      imageBrightness.value = 110;
      imageContrast.value = 120;
      applyImageAdjustments();
      
      // Restore button
      enhanceImageBtn.disabled = false;
      enhanceImageBtn.innerHTML = '<i class="bi bi-brightness-high"></i> Enhance Image';
    }, 1500);
  }
  
  // Apply image adjustments (brightness, contrast)
  function applyImageAdjustments() {
    if (!imagePreview.src) return;
    
    const brightness = imageBrightness.value;
    const contrast = imageContrast.value;
    
    // Apply CSS filters
    imagePreview.style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  }
  
  // Generate content
  async function generateContent() {
    if (!businessProfile) {
      showAlert('Business profile is required to generate content', 'warning');
      return;
    }
    
    const topic = contentTopic.value.trim();
      const tone = contentTone.value;
    const goal = contentGoal.value;
      
    if (!topic) {
      showAlert('Please enter a topic for your content', 'warning');
        return;
      }
      
    // Show loading state
      generateContentBtn.disabled = true;
      generateContentBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
      
    try {
      // In a real implementation, this would call an API
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate content based on profile, topic, tone, and goal
      const content = generateContentBasedOnProfile(topic, tone, goal);
      
      // Set content
      postContent.value = content.text;
      postHashtags.value = content.hashtags;
      
      // Update preview
      updatePreview();
      
      // Restore button
        generateContentBtn.disabled = false;
        generateContentBtn.innerHTML = '<i class="bi bi-magic"></i> Generate Content';
    } catch (error) {
      console.error('Error generating content:', error);
      showAlert('Failed to generate content. Please try again.', 'danger');
      
      // Restore button
      generateContentBtn.disabled = false;
      generateContentBtn.innerHTML = '<i class="bi bi-magic"></i> Generate Content';
    }
  }

  // Generate content based on profile, topic, tone, and goal
  function generateContentBasedOnProfile(topic, tone, goal) {
    if (!businessProfile) return { text: '', hashtags: '' };
    
    let contentText = '';
    let contentHashtags = '';
    
    // Generate content based on goal
    switch (goal) {
      case 'engagement':
        contentText = `📢 Want to know more about ${topic}?\n\nAt ${businessProfile.businessName}, we specialize in providing ${topic} solutions that meet your needs.\n\nDrop a comment below with your questions!`;
        break;
      case 'awareness':
        contentText = `Did you know? ${capitalizeFirstLetter(topic)} can benefit you in many ways.\n\nAt ${businessProfile.businessName}, we're experts in ${topic} and can help you achieve your goals.`;
        break;
      case 'traffic':
        contentText = `Looking for the best ${topic} solutions? Look no further!\n\nVisit our website to learn how ${businessProfile.businessName} can help you with all your ${topic} needs.`;
        break;
      case 'sales':
        contentText = `🔥 Special offer on our ${topic} services! 🔥\n\nFor a limited time, ${businessProfile.businessName} is offering exclusive deals on ${topic}.\n\nDon't miss out!`;
        break;
      case 'education':
        contentText = `Top 3 things to know about ${topic}:\n\n1. [First important point about ${topic}]\n2. [Second important point]\n3. [Third important point]\n\nAt ${businessProfile.businessName}, we're dedicated to helping you understand ${topic} better.`;
        break;
      default:
        contentText = `Let's talk about ${topic}!\n\nAt ${businessProfile.businessName}, we're passionate about ${topic} and would love to share our expertise with you.`;
    }
    
    // Adjust tone
    switch (tone) {
      case 'professional':
        contentText = contentText.replace('Want to know', 'Interested in learning');
        contentText = contentText.replace('Drop a comment', 'Please share your thoughts');
        contentText = contentText.replace('🔥 Special offer', 'Limited Time Offer');
        contentText = contentText.replace('Don\'t miss out!', 'Contact us today for more information.');
        break;
      case 'casual':
        contentText = contentText.replace('Interested in learning', 'Curious about');
        contentText = contentText.replace('Please share your thoughts', 'Let us know what you think');
        break;
      case 'humorous':
        contentText = contentText.replace('Interested in learning', 'Ever wondered');
        contentText = contentText.replace('experts in', 'obsessed with (in a good way!)');
        contentText = contentText.replace('Don\'t miss out!', 'Seriously, you'd be crazy to miss this!');
        break;
      case 'inspirational':
        contentText = contentText.replace('Looking for', 'Ready to discover');
        contentText = contentText.replace('can help you', 'can empower you to');
        contentText = contentText.replace('Don\'t miss out!', 'Take the first step toward your goals today!');
        break;
    }
    
    // Generate hashtags based on topic, business type, and goal
    const hashtags = [`#${topic.replace(/\s+/g, '')}`, `#${businessProfile.businessType.replace(/\s+/g, '')}`];
    
    // Add goal-specific hashtags
    switch (goal) {
      case 'engagement':
        hashtags.push('#engage', '#community', '#connect');
        break;
      case 'awareness':
        hashtags.push('#didyouknow', '#awareness', '#learn');
        break;
      case 'traffic':
        hashtags.push('#clicklink', '#website', '#learnmore');
        break;
      case 'sales':
        hashtags.push('#offer', '#deal', '#limited', '#sale');
        break;
      case 'education':
        hashtags.push('#tips', '#education', '#knowledge');
        break;
    }
    
    // Mix in some business-specific hashtags
    if (businessProfile.targetAudiences && businessProfile.targetAudiences.length > 0) {
      const audience = businessProfile.targetAudiences[0];
      hashtags.push(`#${audience.split(' ')[0].toLowerCase()}`);
    }
    
    // Shuffle and limit hashtags
    const shuffledHashtags = hashtags.sort(() => 0.5 - Math.random()).slice(0, 6);
    contentHashtags = shuffledHashtags.join(' ');
    
    return { text: contentText, hashtags: contentHashtags };
  }
  
  // Switch platform preview
  function switchPlatformPreview(e) {
    // Get platform
    const platform = e.target.getAttribute('data-platform');
    
    // Update active button
    platformPreviewButtons.forEach(button => {
      button.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Show selected platform preview
    // In a real implementation, this would show different previews for different platforms
    // For now, we'll just update the preview title
    document.querySelectorAll('.platform-preview').forEach(preview => {
      preview.classList.add('d-none');
    });
    
    // Show the specific platform preview (currently only Instagram is implemented)
    const previewElement = document.getElementById(`${platform}-preview`);
    if (previewElement) {
      previewElement.classList.remove('d-none');
    }
    
    // Update preview content
    updatePreview();
  }
  
  // Update preview
  function updatePreview() {
    const content = postContent.value;
    const hashtags = postHashtags.value;
    
    // Update caption
    previewCaption.textContent = content;
    
    // Update hashtags
    previewHashtags.textContent = hashtags;
    
    // For a real implementation, this would update the preview image as well
  }
  
  // Save post
  async function savePost() {
    if (!validateForm()) {
      return;
    }
    
    try {
      // Show loading state
      savePostBtn.disabled = true;
      savePostBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
      
      if (devMode) {
        // In dev mode, just simulate saving
        setTimeout(() => {
          showAlert('Post saved successfully (Dev Mode)!', 'success');
          savePostBtn.disabled = false;
          savePostBtn.innerHTML = 'Save Post';
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        }, 1500);
        return;
      }
      
      // Normal API saving for production mode
      // Get form data
      const formData = new FormData();
      
      // Add post data
      formData.append('postType', postType.value);
      formData.append('content', postContent.value);
      formData.append('hashtags', postHashtags.value);
      formData.append('scheduledDate', postDate.value);
      
      // Add template if selected
      if (templateSelect.value) {
        formData.append('templateId', templateSelect.value);
      }
      
      // Add platforms
        const selectedPlatforms = [];
        document.querySelectorAll('.platform-checkbox:checked').forEach(checkbox => {
          selectedPlatforms.push(checkbox.value);
        });
      formData.append('platforms', JSON.stringify(selectedPlatforms));
      
      // Add image if uploaded
      if (postImage.files.length > 0) {
        formData.append('image', postImage.files[0]);
      }
      
      // Add platform optimization settings
      formData.append('autoResize', autoResize.checked);
      formData.append('autoCaption', autoCaption.checked);
      
      // Add Instagram-specific settings
      if (document.getElementById('instagram-first-comment').checked) {
        formData.append('instagramFirstComment', true);
      }
      
      // Show loading state
      savePostBtn.disabled = true;
      savePostBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
      
      // In a real implementation, this would call an API
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      showAlert('Post scheduled successfully!', 'success');
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
      window.location.href = 'dashboard.html';
      }, 1500);
    } catch (error) {
      console.error('Error saving post:', error);
      showAlert('Server error. Please try again later.', 'danger');
      
      savePostBtn.disabled = false;
      savePostBtn.innerHTML = 'Save Post';
    }
  }

  // Validate form
  function validateForm() {
    // Check post type
    if (!postType.value) {
      showAlert('Please select a post type', 'danger');
      postType.focus();
      return false;
    }
    
    // Check platforms
    const selectedPlatforms = document.querySelectorAll('.platform-checkbox:checked');
    if (selectedPlatforms.length === 0) {
      showAlert('Please select at least one platform', 'danger');
      return false;
    }
    
    // Check content
    if (!postContent.value.trim()) {
      showAlert('Please enter post content', 'danger');
      postContent.focus();
      return false;
    }
    
    // Check date
    if (!postDate.value) {
      showAlert('Please select a scheduled date', 'danger');
      postDate.focus();
      return false;
    }
    
    return true;
  }

  // Show alert
  function showAlert(message, type) {
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.setAttribute('role', 'alert');
    alertElement.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(alertElement, container.firstChild);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      const alert = bootstrap.Alert.getOrCreateInstance(alertElement);
      alert.close();
    }, 5000);
  }
  
  // Helper function to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
});
