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
          primaryColor: '#4285f4',
          secondaryColor: '#34a853',
          accentColor: '#ea4335'
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
    
    // Set brand colors
    primaryColor.style.backgroundColor = profile.primaryColor || '#4285f4';
    secondaryColor.style.backgroundColor = profile.secondaryColor || '#34a853';
    accentColor.style.backgroundColor = profile.accentColor || '#ea4335';
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
      aiTemplateBtn.innerHTML = '<i class="bi bi-magic"></i> Let AI Choose';
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
        primary: profile.primaryColor || '#4285f4',
        secondary: profile.secondaryColor || '#34a853',
        accent: profile.accentColor || '#ea4335'
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
    
    // Prepare prompt for OpenAI
    const prompt = `Create a social media post for a business with the following details:
    
Business Name: ${businessData.name}
Business Type: ${businessData.type}
Industry: ${businessData.industry}
Brand Colors: Primary: ${businessData.colors.primary}, Secondary: ${businessData.colors.secondary}, Accent: ${businessData.colors.accent}
Business Description: ${businessData.description || 'A professional business providing quality services.'}
Template Style: ${templateType}

Please provide:
1. A compelling headline (5-7 words)
2. A short, engaging caption (2-3 sentences)
3. A clear call to action
4. 4-5 relevant hashtags
5. A brief description of what image would best complement this post

Format the response as JSON with these fields: headline, caption, callToAction, hashtags, imageDescription`;

    // Make API request to OpenAI
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional social media marketing expert who creates compelling branded content. Respond in JSON format only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('OpenAI API error: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      try {
        // Parse the JSON response from ChatGPT
        const content = JSON.parse(data.choices[0].message.content);
        
        // Save the generated content
        generatedContent = content;
        
        // Display the content in the preview
        displayPreview(businessData, content);
      } catch (error) {
        console.error('Error parsing OpenAI response:', error);
        showAlert('Error with OpenAI response. Using built-in generation instead.', 'warning');
        generateWithBuiltIn(businessData);
      }
    })
    .catch(error => {
      console.error('OpenAI API error:', error);
      showAlert('Error connecting to OpenAI. Using built-in generation instead.', 'warning');
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
      <div class="social-post" style="max-width: 500px; margin: 0 auto; font-family: 'Arial', sans-serif;">
        <div class="post-header" style="background-color: ${businessData.colors.primary}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <div class="d-flex align-items-center">
            <img src="${businessData.logoUrl ? `${API_URL}/uploads/${businessData.logoUrl}` : 'img/placeholder-logo.png'}" alt="${businessData.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid white;">
            <div class="ms-3">
              <h5 class="mb-0">${businessData.name}</h5>
              <small>${businessData.type}</small>
            </div>
          </div>
        </div>
        
        <div class="post-image" style="height: 300px; background-color: #f8f9fa; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #dee2e6; border-right: 1px solid #dee2e6;">
          <i class="bi bi-image" style="font-size: 48px; color: #adb5bd;"></i>
          <p class="text-muted mt-2">${content.imageDescription}</p>
        </div>
        
        <div class="post-content" style="padding: 20px; border: 1px solid #dee2e6; border-radius: 0 0 8px 8px;">
          <h4 style="color: ${businessData.colors.primary};">${content.headline}</h4>
          <p>${content.caption}</p>
          <p class="fw-bold" style="color: ${businessData.colors.secondary};">${content.callToAction}</p>
          <p class="text-muted">${content.hashtags}</p>
        </div>
      </div>
    `;
  }
  
  function createBoldTemplate(businessData, content) {
    return `
      <div class="social-post" style="max-width: 500px; margin: 0 auto; font-family: 'Arial', sans-serif;">
        <div class="post-header" style="padding: 15px; background-color: ${businessData.colors.primary}; color: white; border-radius: 8px 8px 0 0;">
          <h3 style="margin: 0; font-weight: 800; text-transform: uppercase; text-align: center;">${content.headline}</h3>
        </div>
        
        <div class="post-image" style="position: relative; height: 300px; background-color: #f8f9fa; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;">
          <i class="bi bi-image" style="font-size: 48px; color: #adb5bd;"></i>
          <p class="text-muted mt-2">${content.imageDescription}</p>
          
          <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 10px 15px; background-color: rgba(0,0,0,0.7); color: white;">
            <div class="d-flex align-items-center">
              <img src="${businessData.logoUrl ? `${API_URL}/uploads/${businessData.logoUrl}` : 'img/placeholder-logo.png'}" alt="${businessData.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid white;">
              <div class="ms-2">
                <h6 class="mb-0">${businessData.name}</h6>
              </div>
            </div>
          </div>
        </div>
        
        <div class="post-content" style="padding: 20px; background-color: white; border: 3px solid ${businessData.colors.primary}; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 1.1rem;">${content.caption}</p>
          <p class="fw-bold" style="color: ${businessData.colors.accent}; font-size: 1.2rem; text-transform: uppercase;">${content.callToAction}</p>
          <p style="color: ${businessData.colors.primary};">${content.hashtags}</p>
        </div>
      </div>
    `;
  }
  
  function createBusinessTemplate(businessData, content) {
    return `
      <div class="social-post" style="max-width: 500px; margin: 0 auto; font-family: 'Arial', sans-serif; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
        <div class="d-flex">
          <div style="width: 40%; padding: 20px; background-color: ${businessData.colors.primary}; color: white; display: flex; flex-direction: column; justify-content: center;">
            <img src="${businessData.logoUrl ? `${API_URL}/uploads/${businessData.logoUrl}` : 'img/placeholder-logo.png'}" alt="${businessData.name}" class="mb-3" style="width: 80px; height: 80px; object-fit: contain; background-color: white; padding: 5px; border-radius: 5px;">
            <h5>${businessData.name}</h5>
            <p class="small">${businessData.type}</p>
            <div class="mt-auto">
              <p class="mb-0 fw-bold">${content.callToAction}</p>
            </div>
          </div>
          
          <div style="width: 60%;">
            <div class="post-image" style="height: 200px; background-color: #f8f9fa; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <i class="bi bi-image" style="font-size: 48px; color: #adb5bd;"></i>
              <p class="text-muted small mt-2">${content.imageDescription}</p>
            </div>
            
            <div style="padding: 15px; background-color: white;">
              <h5 style="color: ${businessData.colors.secondary};">${content.headline}</h5>
              <p class="small">${content.caption}</p>
              <p class="text-muted small">${content.hashtags}</p>
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
    savePostBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
    
    // Prepare post data
    const postData = {
      businessId: profile.id,
      content: generatedContent.caption,
      headline: generatedContent.headline,
      callToAction: generatedContent.callToAction,
      hashtags: generatedContent.hashtags,
      scheduledDate: postDate.value,
      template: selectedTemplate,
      imageDescription: generatedContent.imageDescription
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
        showAlert('Error saving post: ' + data.message, 'danger');
        savePostBtn.disabled = false;
        savePostBtn.innerHTML = '<i class="bi bi-calendar-check"></i> Schedule Post';
      }
    })
    .catch(error => {
      console.error('Error saving post:', error);
      showAlert('Error saving post. Please try again.', 'danger');
      savePostBtn.disabled = false;
      savePostBtn.innerHTML = '<i class="bi bi-calendar-check"></i> Schedule Post';
    });
  }
  
  // Display alert message
  function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    
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
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
  }
}); 