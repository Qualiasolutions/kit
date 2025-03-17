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
  if (!profileComplete && !devMode) {
    showAlert('Please complete your business profile first.', 'warning');
    // Redirect to profile setup after a delay
    setTimeout(() => {
      window.location.href = 'profile-setup.html';
    }, 2000);
    return;
  }

  // API base URL
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '' : 'https://kit-lime.vercel.app';

  // Default brand colors
  const DEFAULT_COLORS = {
    primary: '#00897b',
    secondary: '#26a69a',
    accent: '#4db6ac'
  };

  // DOM Elements
  const businessNameDisplay = document.getElementById('business-name-display');
  const businessTypeDisplay = document.getElementById('business-type-display');
  const businessLogo = document.getElementById('business-logo');
  const primaryColor = document.getElementById('primary-color');
  const secondaryColor = document.getElementById('secondary-color');
  const accentColor = document.getElementById('accent-color');
  const useOpenAI = document.getElementById('use-openai');
  const apiKeyContainer = document.getElementById('api-key-container');
  const openaiKey = document.getElementById('openai-key');
  const aiTemplateBtn = document.getElementById('ai-template-btn');
  const generateBtn = document.getElementById('generate-btn');
  const previewContent = document.getElementById('preview-content');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingMessage = document.getElementById('loading-message');
  const saveControls = document.getElementById('save-controls');
  const postDate = document.getElementById('post-date');
  const savePostBtn = document.getElementById('save-post-btn');
  
  // Profile and state
  let profile = mockProfile || null;
  let selectedTemplate = null;
  let generatedContent = null;

  // Set default date to tomorrow at 6:00 PM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);
  postDate.value = tomorrow.toISOString().slice(0, 16);
  
  // Initialize
  setupEventListeners();
  loadBusinessProfile();
  
  // Setup all event listeners
  function setupEventListeners() {
    // OpenAI toggle
    useOpenAI.addEventListener('change', function() {
      apiKeyContainer.classList.toggle('show', this.checked);
    });
    
    // Template card selection
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', function() {
        const radio = this.querySelector('input[type="radio"]');
        radio.checked = true;
        selectedTemplate = radio.value;
        
        // Highlight selected card
        document.querySelectorAll('.template-card').forEach(c => {
          c.classList.remove('selected');
        });
        this.classList.add('selected');
      });
    });
    
    // AI template selection
    aiTemplateBtn.addEventListener('click', selectAiTemplate);
    
    // Generate content
    generateBtn.addEventListener('click', generateContent);
    
    // Save post
    savePostBtn.addEventListener('click', savePost);
    
    // Logout
    document.getElementById('logout-link').addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    });
  }
  
  // Load business profile
  function loadBusinessProfile() {
    if (devMode && mockProfile) {
      // Use mock profile
      profile = mockProfile;
      displayBusinessProfile();
      return;
    }
    
    // In production, load from API
    fetch(`${API_URL}/api/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        profile = data.data;
        displayBusinessProfile();
      } else {
        showAlert('Failed to load business profile', 'danger');
      }
    })
    .catch(error => {
      console.error('Error loading profile:', error);
      if (devMode) {
        // In dev mode, create a mock profile
        profile = {
          businessName: 'Your Business',
          businessType: 'Marketing',
          primaryColor: DEFAULT_COLORS.primary,
          secondaryColor: DEFAULT_COLORS.secondary,
          accentColor: DEFAULT_COLORS.accent
        };
        displayBusinessProfile();
      } else {
        showAlert('Error loading business profile', 'danger');
      }
    });
  }
  
  // Display business profile in UI
  function displayBusinessProfile() {
    if (!profile) return;
    
    // Set business name and type
    businessNameDisplay.textContent = profile.businessName || 'Your Business';
    businessTypeDisplay.textContent = profile.businessType || 'Business';
    
    // Set logo
    if (profile.logoUrl) {
      businessLogo.src = `${API_URL}/uploads/${profile.logoUrl}`;
    }
    
    // Set brand colors - using teal color scheme if no colors are defined
    primaryColor.style.backgroundColor = profile.primaryColor || DEFAULT_COLORS.primary;
    secondaryColor.style.backgroundColor = profile.secondaryColor || DEFAULT_COLORS.secondary;
    accentColor.style.backgroundColor = profile.accentColor || DEFAULT_COLORS.accent;
  }
  
  // Select AI-recommended template
  function selectAiTemplate() {
    aiTemplateBtn.disabled = true;
    aiTemplateBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Selecting...';
    
    // Simulate AI processing
    setTimeout(() => {
      // Select a random template
      const templates = document.querySelectorAll('input[name="template"]');
      if (templates.length > 0) {
        const randomIndex = Math.floor(Math.random() * templates.length);
        templates[randomIndex].checked = true;
        selectedTemplate = templates[randomIndex].value;
        
        // Highlight selected card
        document.querySelectorAll('.template-card').forEach(card => {
          card.classList.remove('selected');
        });
        templates[randomIndex].closest('.template-card').classList.add('selected');
      }
      
      showAlert('AI has selected the optimal template for your business!', 'success');
      
      aiTemplateBtn.disabled = false;
      aiTemplateBtn.innerHTML = '<i class="bi bi-magic me-1"></i> Let AI Choose';
    }, 1200);
  }
  
  // Generate content
  function generateContent() {
    // Validate template selection
    if (!selectedTemplate) {
      showAlert('Please select a template first', 'warning');
      return;
    }
    
    // Show loading overlay
    loadingOverlay.classList.remove('d-none');
    generateBtn.disabled = true;
    
    // Update loading message to show progress
    updateLoadingMessage('Analyzing your brand profile...');
    
    // Prepare business data
    const businessData = {
      name: profile.businessName || 'Your Business',
      type: profile.businessType || 'Business',
      colors: {
        primary: profile.primaryColor || DEFAULT_COLORS.primary,
        secondary: profile.secondaryColor || DEFAULT_COLORS.secondary,
        accent: profile.accentColor || DEFAULT_COLORS.accent
      },
      logoUrl: profile.logoUrl,
      description: profile.description || '',
      industry: profile.industry || profile.businessType || 'Business'
    };
    
    // Simulate step progress in UI
    setTimeout(() => updateLoadingMessage('Generating creative content...'), 800);
    setTimeout(() => updateLoadingMessage('Applying your brand colors...'), 1600);
    setTimeout(() => updateLoadingMessage('Optimizing for engagement...'), 2400);
    
    // Check if using OpenAI
    if (useOpenAI.checked) {
      // Verify API key
      if (!openaiKey.value.trim()) {
        showAlert('Please enter your OpenAI API key', 'warning');
        loadingOverlay.classList.add('d-none');
        generateBtn.disabled = false;
        return;
      }
      
      // Generate with OpenAI
      generateWithOpenAI(businessData);
    } else {
      // Generate with built-in templates
      generateWithBuiltIn(businessData);
    }
  }
  
  // Generate content with OpenAI
  function generateWithOpenAI(businessData) {
    const apiKey = openaiKey.value.trim();
    
    updateLoadingMessage('Connecting to OpenAI...');
    
    // Define template type based on selection
    let templateType = 'Standard';
    switch (selectedTemplate) {
      case 'template-1':
        templateType = 'Modern & Clean';
        break;
      case 'template-2':
        templateType = 'Bold & Colorful';
        break;
      case 'template-3':
        templateType = 'Business Special';
        break;
    }
    
    // Use our backend API to generate content
    fetch(`${API_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        apiKey: apiKey,
        profileId: profile._id,
        templateType: templateType
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('API error: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Transform the response to match our expected format
        const content = {
          headline: data.data.headline,
          caption: data.data.mainText,
          callToAction: data.data.callToAction,
          hashtags: data.data.tags.join(' '),
          imageDescription: data.data.imagePrompt
        };
        
        // Save the generated content
        generatedContent = content;
        
        // Display the content in the preview
        displayPreview(businessData, content);
      } else {
        throw new Error(data.error || 'Failed to generate content');
      }
    })
    .catch(error => {
      console.error('API error:', error);
      showAlert('Error generating content with AI. Using built-in generation instead.', 'warning');
      generateWithBuiltIn(businessData);
    });
  }
  
  // Generate content with built-in templates
  function generateWithBuiltIn(businessData) {
    // Simulate API delay
    setTimeout(() => {
      // Generate content based on business type and template
      const content = {
        headline: generateHeadline(businessData),
        caption: generateCaption(businessData),
        callToAction: generateCTA(businessData),
        hashtags: generateHashtags(businessData),
        imageDescription: generateImageDescription(businessData)
      };
      
      // Save the generated content
      generatedContent = content;
      
      // Display the content in the preview
      displayPreview(businessData, content);
    }, 2500);
  }
  
  // Display preview of generated content
  function displayPreview(businessData, content) {
    // Generate HTML based on selected template
    let previewHTML = '';
    
    switch (selectedTemplate) {
      case 'template-1':
        previewHTML = createModernTemplate(businessData, content);
        break;
      case 'template-2':
        previewHTML = createBoldTemplate(businessData, content);
        break;
      case 'template-3':
        previewHTML = createBusinessTemplate(businessData, content);
        break;
      default:
        previewHTML = createModernTemplate(businessData, content);
    }
    
    // Update preview content
    previewContent.innerHTML = previewHTML;
    
    // Hide loading overlay
    loadingOverlay.classList.add('d-none');
    
    // Enable generate button
    generateBtn.disabled = false;
    
    // Show save controls
    saveControls.classList.remove('d-none');
    
    // Scroll to preview
    previewContent.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Template generators
  function createModernTemplate(businessData, content) {
    return `
      <div class="social-post" style="max-width: 500px; margin: 0 auto; font-family: 'Segoe UI', 'Arial', sans-serif; box-shadow: 0 12px 24px rgba(0,0,0,0.1); border-radius: 16px; overflow: hidden;">
        <div class="post-header" style="background-color: ${businessData.colors.primary}; color: white; padding: 24px; position: relative;">
          <div class="d-flex align-items-center">
            <div style="background-color: white; padding: 8px; border-radius: 12px; margin-right: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <img src="${businessData.logoUrl ? `${API_URL}/uploads/${businessData.logoUrl}` : 'img/placeholder-logo.png'}" alt="${businessData.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
            </div>
            <div>
              <h5 class="mb-0 fw-bold">${businessData.name}</h5>
              <div class="d-flex align-items-center mt-1">
                <i class="bi bi-geo-alt me-1" style="font-size: 12px;"></i>
                <small>${businessData.type}</small>
              </div>
            </div>
          </div>
        </div>
        
        <div class="post-image" style="height: 280px; background-color: #f0f7f6; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 1px solid rgba(0,0,0,0.05);">
          <div style="width: 80px; height: 80px; border-radius: 50%; background-color: rgba(0, 137, 123, 0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <i class="bi bi-image" style="font-size: 42px; color: ${businessData.colors.primary};"></i>
          </div>
          <p class="text-muted px-4 text-center" style="max-width: 280px; font-size: 14px;">${content.imageDescription}</p>
        </div>
        
        <div class="post-content" style="padding: 28px; background-color: white;">
          <h4 style="color: ${businessData.colors.primary}; font-weight: 700; margin-bottom: 16px;">${content.headline}</h4>
          <p style="color: #455a64; line-height: 1.6; margin-bottom: 20px;">${content.caption}</p>
          <div style="background-color: ${businessData.colors.secondary}; padding: 14px; border-radius: 8px; color: white; text-align: center; margin-bottom: 20px; font-weight: 600;">
            ${content.callToAction}
          </div>
          <p style="color: ${businessData.colors.primary}; font-size: 14px;">${content.hashtags}</p>
        </div>
      </div>
    `;
  }
  
  function createBoldTemplate(businessData, content) {
    return `
      <div class="social-post" style="max-width: 500px; margin: 0 auto; font-family: 'Segoe UI', 'Arial', sans-serif; box-shadow: 0 12px 24px rgba(0,0,0,0.1); border-radius: 16px; overflow: hidden;">
        <div class="post-header" style="padding: 20px; background: linear-gradient(135deg, ${businessData.colors.primary} 0%, ${businessData.colors.secondary} 100%); color: white; text-align: center;">
          <h3 style="margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${content.headline}</h3>
        </div>
        
        <div class="post-image" style="position: relative; height: 300px; background-color: #f0f7f6; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;">
          <div style="width: 80px; height: 80px; border-radius: 50%; background-color: rgba(0, 137, 123, 0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <i class="bi bi-image" style="font-size: 42px; color: ${businessData.colors.primary};"></i>
          </div>
          <p class="text-muted px-4 text-center" style="max-width: 280px; font-size: 14px;">${content.imageDescription}</p>
          
          <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 12px 15px; background-color: rgba(0,0,0,0.7); color: white;">
            <div class="d-flex align-items-center">
              <div style="background-color: white; padding: 3px; border-radius: 50%; margin-right: 10px;">
                <img src="${businessData.logoUrl ? `${API_URL}/uploads/${businessData.logoUrl}` : 'img/placeholder-logo.png'}" alt="${businessData.name}" style="width: 38px; height: 38px; object-fit: cover; border-radius: 50%;">
              </div>
              <div>
                <h6 class="mb-0 fw-bold">${businessData.name}</h6>
                <small style="opacity: 0.8;">${businessData.type}</small>
              </div>
            </div>
          </div>
        </div>
        
        <div class="post-content" style="padding: 28px; background-color: white;">
          <p style="font-size: 1.1rem; color: #455a64; line-height: 1.6; margin-bottom: 24px;">${content.caption}</p>
          <div style="position: relative; margin-bottom: 24px;">
            <div style="background: linear-gradient(135deg, ${businessData.colors.secondary} 0%, ${businessData.colors.accent} 100%); color: white; padding: 16px; border-radius: 8px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(0, 137, 123, 0.25);">
              ${content.callToAction}
            </div>
          </div>
          <p style="color: ${businessData.colors.primary}; font-size: 14px; text-align: center;">${content.hashtags}</p>
        </div>
      </div>
    `;
  }
  
  function createBusinessTemplate(businessData, content) {
    return `
      <div class="social-post" style="max-width: 500px; margin: 0 auto; font-family: 'Segoe UI', 'Arial', sans-serif; box-shadow: 0 12px 24px rgba(0,0,0,0.1); border-radius: 16px; overflow: hidden;">
        <div class="d-flex" style="background-color: white;">
          <div style="width: 40%; background: linear-gradient(to bottom, ${businessData.colors.primary} 0%, ${businessData.colors.secondary} 100%); color: white; display: flex; flex-direction: column; padding: 24px;">
            <div style="background-color: white; width: 90px; height: 90px; border-radius: 12px; padding: 6px; margin-bottom: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
              <img src="${businessData.logoUrl ? `${API_URL}/uploads/${businessData.logoUrl}` : 'img/placeholder-logo.png'}" alt="${businessData.name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">
            </div>
            <h5 class="fw-bold mb-1">${businessData.name}</h5>
            <p class="small mb-4" style="opacity: 0.9;">${businessData.type}</p>
            <div class="mt-auto">
              <p class="mb-0 fw-bold" style="background-color: rgba(255,255,255,0.15); padding: 10px; border-radius: 8px; text-align: center;">${content.callToAction}</p>
            </div>
          </div>
          
          <div style="width: 60%;">
            <div style="height: 200px; background-color: #f0f7f6; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background-color: rgba(0, 137, 123, 0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                <i class="bi bi-image" style="font-size: 32px; color: ${businessData.colors.primary};"></i>
              </div>
              <p class="text-muted small text-center px-3" style="line-height: 1.4;">${content.imageDescription}</p>
            </div>
            
            <div style="padding: 24px;">
              <h5 style="color: ${businessData.colors.primary}; font-weight: 700; margin-bottom: 12px;">${content.headline}</h5>
              <p class="small" style="color: #455a64; line-height: 1.6; margin-bottom: 18px;">${content.caption}</p>
              <p class="text-muted small" style="color: ${businessData.colors.secondary} !important;">${content.hashtags}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Content generation helper functions
  function generateHeadline(businessData) {
    const headlines = [
      `Discover ${businessData.name}`,
      `Transform with ${businessData.name}`,
      `Experience the ${businessData.type} Difference`,
      `${businessData.type} Excellence Awaits`,
      `Your Premier ${businessData.type} Partner`,
      `Elevate Your ${businessData.industry} Experience`
    ];
    
    return headlines[Math.floor(Math.random() * headlines.length)];
  }
  
  function generateCaption(businessData) {
    const captions = [
      `At ${businessData.name}, we deliver exceptional ${businessData.type} solutions designed for your unique needs. Our team of experts is ready to help you succeed.`,
      `Looking for quality ${businessData.type} services? ${businessData.name} combines industry expertise with personalized attention to deliver results that exceed expectations.`,
      `${businessData.name} is transforming the ${businessData.industry} landscape with innovative approaches and dedicated service. Join our growing family of satisfied clients.`,
      `We understand the challenges of ${businessData.industry}. That's why ${businessData.name} offers tailored solutions that address your specific needs and goals.`,
      `Quality, reliability, and excellence define everything we do at ${businessData.name}. Experience the difference that makes us the preferred ${businessData.type} provider.`
    ];
    
    return captions[Math.floor(Math.random() * captions.length)];
  }
  
  function generateCTA(businessData) {
    const ctas = [
      `Contact us today for a free consultation!`,
      `Visit our website to learn more about our services!`,
      `Call now to schedule your appointment!`,
      `Follow us for more ${businessData.industry} tips and insights!`,
      `Subscribe to our newsletter for exclusive offers!`,
      `Book your session today and experience the difference!`
    ];
    
    return ctas[Math.floor(Math.random() * ctas.length)];
  }
  
  function generateHashtags(businessData) {
    // Create business-specific hashtags
    const name = businessData.name.replace(/\s+/g, '');
    const type = businessData.type.replace(/\s+/g, '');
    const industry = businessData.industry.replace(/\s+/g, '');
    
    // Generic hashtag pool
    const genericTags = [
      'Quality', 'Excellence', 'Innovation', 'BestInClass', 
      'Premium', 'TrustedPartner', 'CustomerFocus', 'Professional'
    ];
    
    // Create final set of hashtags
    let hashtags = [`#${name}`, `#${type}`, `#${industry}`];
    
    // Add some random generic tags
    const shuffled = [...genericTags].sort(() => 0.5 - Math.random());
    hashtags = hashtags.concat(shuffled.slice(0, 2).map(tag => `#${tag}`));
    
    return hashtags.join(' ');
  }
  
  function generateImageDescription(businessData) {
    const descriptions = [
      `Professional image highlighting ${businessData.name}'s expertise in ${businessData.industry}`,
      `High-quality photo showcasing ${businessData.type} excellence`,
      `Engaging visual that represents the quality of ${businessData.name}'s services`,
      `Professional team members demonstrating ${businessData.type} in action`,
      `Stylish image that aligns with ${businessData.name}'s brand identity`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }
  
  // Helper function to update loading message
  function updateLoadingMessage(message) {
    loadingMessage.textContent = message;
  }
  
  // Save and schedule post
  function savePost() {
    if (!generatedContent) {
      showAlert('Please generate content first', 'warning');
      return;
    }
    
    savePostBtn.disabled = true;
    savePostBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Saving...';
    
    // Check if using OpenAI for image generation
    const generateImage = useOpenAI.checked && openaiKey.value.trim() !== '';
    
    // Function to save post with image if available
    const savePostWithImage = (imageUrl = null) => {
      // Prepare post data
      const postData = {
        content: generatedContent.caption,
        headline: generatedContent.headline,
        callToAction: generatedContent.callToAction,
        hashtags: generatedContent.hashtags,
        scheduledDate: postDate.value,
        template: selectedTemplate,
        imageDescription: generatedContent.imageDescription,
        imageUrl: imageUrl
      };
      
      if (devMode) {
        // In dev mode, just simulate success
        setTimeout(() => {
          showAlert('Your post has been scheduled successfully!', 'success');
          
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        }, 1500);
        return;
      }
      
      // In production, send to API
      fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showAlert('Your post has been scheduled successfully!', 'success');
          
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        } else {
          showAlert('Error saving post: ' + (data.error || 'Unknown error'), 'danger');
          savePostBtn.disabled = false;
          savePostBtn.innerHTML = '<i class="bi bi-calendar-check me-2"></i> Schedule Post';
        }
      })
      .catch(error => {
        console.error('Error saving post:', error);
        showAlert('Error saving post. Please try again.', 'danger');
        savePostBtn.disabled = false;
        savePostBtn.innerHTML = '<i class="bi bi-calendar-check me-2"></i> Schedule Post';
      });
    };
    
    if (generateImage) {
      // Upload a placeholder image and get a generated one later
      // This is a simplified approach - in a real app, you'd generate the image first
      savePostWithImage(null);
    } else {
      // Save post without image
      savePostWithImage();
    }
  }
  
  // Display alert message
  function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <div class="d-flex align-items-center">
          <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'danger' ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-2"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    
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