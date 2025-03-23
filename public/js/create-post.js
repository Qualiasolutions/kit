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

  // DOM elements
  const templateContainer = document.getElementById('template-container');
  const templatePreview = document.getElementById('template-preview');
  const postTopicInput = document.getElementById('post-topic');
  const platformSelect = document.getElementById('platform-select');
  const contentTypeSelect = document.getElementById('content-type-select');
  const toneSelect = document.getElementById('tone-select');
  const generateBtn = document.getElementById('generate-btn');
  const loadingIndicator = document.getElementById('loading-indicator');
  const postTitleInput = document.getElementById('post-title');
  const postContentInput = document.getElementById('post-content');
  const hashtagsContainer = document.getElementById('hashtags-container');
  const generateHashtagsBtn = document.getElementById('generate-hashtags-btn');
  const alertContainer = document.getElementById('alert-container');
  const businessProfileInfoEl = document.getElementById('business-profile-info');

  // State variables
  let selectedTemplate = null;
  let generatedContent = null;
  let isGenerating = false;
  let templates = [];
  let templateCategories = [];
  let businessProfile = null;

  // Initialize: Load business profile first, then templates
  fetchBusinessProfile()
    .then(() => fetchTemplateCategories())
    .catch(error => {
      console.error('Error during initialization:', error);
      showAlert('Could not load required data. Please try refreshing the page.', 'danger');
    });

  // Fetch business profile data
  async function fetchBusinessProfile() {
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch business profile');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        businessProfile = data.data;
        updateBusinessProfileDisplay();
      } else {
        showAlert('Please complete your business profile setup before creating AI content', 'warning');
        businessProfileInfoEl.innerHTML = `
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Business profile not found!</strong> 
            <p class="mb-0">Please <a href="profile-setup.html" class="alert-link">complete your business profile</a> to enhance content generation.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
      showAlert('Could not load your business profile', 'warning');
    }
  }

  // Display business profile summary
  function updateBusinessProfileDisplay() {
    if (!businessProfile || !businessProfileInfoEl) return;

    const socialPlatforms = businessProfile.socialPlatforms ? 
      Object.keys(businessProfile.socialPlatforms)
        .filter(platform => businessProfile.socialPlatforms[platform])
        .join(', ') : 
      'None';

    businessProfileInfoEl.innerHTML = `
      <div class="d-flex align-items-center mb-3">
        <div class="me-3">
          <i class="bi bi-building text-primary" style="font-size: 1.5rem;"></i>
        </div>
        <div>
          <h6 class="mb-1">${businessProfile.businessName}</h6>
          <p class="text-muted small mb-0">${businessProfile.industry} / ${businessProfile.niche}</p>
        </div>
      </div>
      <p class="small mb-1"><strong>Target Audience:</strong> ${businessProfile.targetAudience?.join(', ') || 'Not specified'}</p>
      <p class="small mb-1"><strong>Voice:</strong> ${businessProfile.businessVoice?.join(', ') || 'Not specified'}</p>
      <p class="small mb-0"><strong>Platforms:</strong> ${socialPlatforms}</p>
    `;

    // Pre-select the platform based on the user's social platforms
    if (businessProfile.socialPlatforms && platformSelect) {
      const platforms = Object.keys(businessProfile.socialPlatforms)
        .filter(platform => businessProfile.socialPlatforms[platform]);
      
      if (platforms.length > 0) {
        const platformToSelect = platforms[0].toLowerCase();
        
        // Find the option with this value or closest match
        for (const option of platformSelect.options) {
          if (option.value.toLowerCase().includes(platformToSelect)) {
            platformSelect.value = option.value;
            break;
          }
        }
      }
    }
  }

  // Fetch template categories
  async function fetchTemplateCategories() {
    try {
      const response = await fetch(`${API_URL}/api/templates/categories`);
      const data = await response.json();
      
      if (data.success) {
        templateCategories = data.categories;
        await fetchTemplates();
      } else {
        showAlert('Failed to load template categories', 'danger');
      }
    } catch (error) {
      console.error('Error fetching template categories:', error);
      showAlert('Network error when loading templates', 'danger');
    }
  }

  // Fetch templates for all categories
  async function fetchTemplates() {
    try {
      if (templateCategories.length === 0) {
        await fetchTemplateCategories();
        return;
      }

      // Get templates for each category
      const templatePromises = templateCategories.map(category => 
        fetch(`${API_URL}/api/templates/category/${category.id}?count=1`)
          .then(res => res.json())
      );
      
      const results = await Promise.all(templatePromises);
      
      templates = results.flatMap(result => 
        result.success ? result.templates : []
      );
      
      renderTemplates();
    } catch (error) {
      console.error('Error fetching templates:', error);
      showAlert('Failed to load templates', 'danger');
      
      // Fall back to static templates
      useStaticTemplatesFallback();
    }
  }

  // Fallback to static templates if the API fails
  function useStaticTemplatesFallback() {
    templates = [
      {
        id: 'product-showcase',
        categoryId: 'product-showcase',
        categoryName: 'Product Showcase',
        url: 'img/templates/product-showcase.jpg',
        thumbnailUrl: 'img/templates/product-showcase.jpg',
        authorName: 'OmuMediaKit',
        overlay: { position: 'bottom', textColor: 'white', bgOpacity: 0.7 }
      },
      {
        id: 'testimonial',
        categoryId: 'testimonial',
        categoryName: 'Testimonial',
        url: 'img/templates/testimonial.jpg',
        thumbnailUrl: 'img/templates/testimonial.jpg',
        authorName: 'OmuMediaKit',
        overlay: { position: 'center', textColor: 'white', bgOpacity: 0.7 }
      },
      {
        id: 'industry-tip',
        categoryId: 'industry-tip',
        categoryName: 'Industry Tip',
        url: 'img/templates/tip.jpg',
        thumbnailUrl: 'img/templates/tip.jpg',
        authorName: 'OmuMediaKit',
        overlay: { position: 'top', textColor: 'white', bgOpacity: 0.6 }
      },
      {
        id: 'promotional-offer',
        categoryId: 'promotional-offer',
        categoryName: 'Promotional Offer',
        url: 'img/templates/promo.jpg',
        thumbnailUrl: 'img/templates/promo.jpg',
        authorName: 'OmuMediaKit',
        overlay: { position: 'center', textColor: 'white', bgOpacity: 0.6 }
      },
      {
        id: 'event-announcement',
        categoryId: 'event-announcement',
        categoryName: 'Event Announcement',
        url: 'img/templates/event.jpg',
        thumbnailUrl: 'img/templates/event.jpg',
        authorName: 'OmuMediaKit',
        overlay: { position: 'bottom', textColor: 'white', bgOpacity: 0.7 }
      },
      {
        id: 'company-news',
        categoryId: 'company-news',
        categoryName: 'Company News',
        url: 'img/templates/news.jpg',
        thumbnailUrl: 'img/templates/news.jpg',
        authorName: 'OmuMediaKit',
        overlay: { position: 'top', textColor: 'white', bgOpacity: 0.6 }
      }
    ];
    
    renderTemplates();
  }

  // Render templates in the container
  function renderTemplates() {
    templateContainer.innerHTML = '';
    
    templates.forEach(template => {
      const templateCard = document.createElement('div');
      templateCard.className = 'template-card';
      templateCard.dataset.templateId = template.id;
      
      templateCard.innerHTML = `
        <div class="template-image">
          <img src="${template.thumbnailUrl}" alt="${template.categoryName}">
        </div>
        <div class="template-info">
          <h5>${template.categoryName}</h5>
          <p class="text-muted small">${template.attribution || `Photo by ${template.authorName}`}</p>
        </div>
      `;
      
      templateCard.addEventListener('click', () => selectTemplate(template));
      templateContainer.appendChild(templateCard);
    });
    
    // Select the first template by default
    if (templates.length > 0) {
      selectTemplate(templates[0]);
    }
  }

  // Handle template selection
  function selectTemplate(template) {
    selectedTemplate = template;
    
    // Update visual selection
    document.querySelectorAll('.template-card').forEach(card => {
      card.classList.remove('selected');
      if (card.dataset.templateId === template.id) {
        card.classList.add('selected');
      }
    });
    
    // Update preview
    updateTemplatePreview();
  }

  // Update the template preview with current selected template
  function updateTemplatePreview() {
    if (!selectedTemplate) return;
    
    const previewTitle = postTitleInput.value || 'Your Post Title';
    const previewContent = postContentInput.value || 'Your content will appear here after generation. This is where your main message will be displayed.';
    
    templatePreview.innerHTML = `
      <div class="preview-image-container">
        <img src="${selectedTemplate.url}" alt="${selectedTemplate.categoryName}" class="img-fluid">
        <div class="preview-overlay preview-${selectedTemplate.overlay.position}" 
             style="background-color: rgba(0,0,0,${selectedTemplate.overlay.bgOpacity});">
          <h4 style="color: ${selectedTemplate.overlay.textColor}">${previewTitle}</h4>
          <p style="color: ${selectedTemplate.overlay.textColor}">${previewContent}</p>
        </div>
      </div>
      <div class="preview-caption mt-2">
        <p class="mb-0"><small class="text-muted">${selectedTemplate.attribution || `Photo by ${selectedTemplate.authorName}`}</small></p>
        ${selectedTemplate.authorUrl ? `<p class="mb-0"><small class="text-muted"><a href="${selectedTemplate.authorUrl}" target="_blank" rel="noopener noreferrer">View on Unsplash</a></small></p>` : ''}
      </div>
    `;
  }

  // Generate post content
  async function generatePost() {
    if (isGenerating) return;
    
    const topic = postTopicInput.value.trim();
    const platform = platformSelect.value;
    const contentType = contentTypeSelect.value;
    const tone = toneSelect.value;
    
    if (!topic) {
      showAlert('Please enter a post topic', 'warning');
      postTopicInput.focus();
      return;
    }
    
    isGenerating = true;
    generateBtn.disabled = true;
    loadingIndicator.style.display = 'block';
    
    try {
      const templateType = selectedTemplate ? selectedTemplate.category : 'general';
      
      const response = await fetch(`${API_URL}/api/ai/generate-post`, {
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
          templateType,
          businessProfile: businessProfile // Include the business profile data
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        generatedContent = data.content;
        
        if (generatedContent.title) {
          postTitleInput.value = generatedContent.title;
        }
        
        if (generatedContent.content) {
          postContentInput.value = generatedContent.content;
        }
        
        if (generatedContent.hashtags && generatedContent.hashtags.length > 0) {
          renderHashtags(generatedContent.hashtags);
        } else {
          hashtagsContainer.innerHTML = '';
        }
      } else {
        showAlert(data.error || 'Failed to generate content', 'danger');
      }
    } catch (error) {
      console.error('Error generating post:', error);
      showAlert('Network error when generating content', 'danger');
    } finally {
      isGenerating = false;
      generateBtn.disabled = false;
      loadingIndicator.style.display = 'none';
    }
  }

  // Generate hashtags
  async function generateHashtags() {
    const topic = postTopicInput.value.trim();
    const platform = platformSelect.value;
    
    if (!topic || !platform) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/generate-hashtags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic,
          platform
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Display hashtags
        renderHashtags(data.hashtags);
      }
    } catch (error) {
      console.error('Error generating hashtags:', error);
    }
  }

  // Render hashtags in the container
  function renderHashtags(hashtags) {
    hashtagsContainer.innerHTML = '';
    
    hashtags.forEach(hashtag => {
      const hashtagElement = document.createElement('span');
      hashtagElement.className = 'hashtag-bubble';
      hashtagElement.textContent = hashtag;
      hashtagsContainer.appendChild(hashtagElement);
    });
  }

  // Show alert message
  function showAlert(message, type) {
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

  // Setup event listeners
  generateBtn.addEventListener('click', generatePost);
  
  generateHashtagsBtn.addEventListener('click', generateHashtags);
  
  postTitleInput.addEventListener('input', updateTemplatePreview);
  postContentInput.addEventListener('input', updateTemplatePreview);
  
  // Listen for platform changes to update UI
  platformSelect.addEventListener('change', function() {
    // Update hints or UI based on selected platform
    const platform = this.value;
    
    // Show/hide platform-specific options
    if (platform === 'instagram' || platform === 'tiktok') {
      document.getElementById('visual-options').classList.remove('d-none');
    } else {
      document.getElementById('visual-options').classList.add('d-none');
    }
  });
}); 