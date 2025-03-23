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

  // State variables
  let selectedTemplate = null;
  let generatedContent = null;
  let isGenerating = false;
  let templates = [];
  let templateCategories = [];

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
          <p class="text-muted small">Photo by ${template.authorName}</p>
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
        <p class="mb-0"><small class="text-muted">Photo by ${selectedTemplate.authorName}</small></p>
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
    const templateType = selectedTemplate ? selectedTemplate.categoryId : '';
    
    // Validate inputs
    if (!topic) {
      showAlert('Please enter a post topic', 'warning');
      return;
    }
    
    // Show loading state
    isGenerating = true;
    generateBtn.disabled = true;
    loadingIndicator.classList.remove('d-none');
    showAlert('Generating your content...', 'info');
    
    try {
      const response = await fetch(`${API_URL}/api/generate-post`, {
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
          templateType
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        generatedContent = data.content;
        
        // Update the form with generated content
        postTitleInput.value = generatedContent.title;
        postContentInput.value = generatedContent.content;
        
        // Update preview
        updateTemplatePreview();
        
        // Generate hashtags automatically
        generateHashtags();
        
        showAlert('Content generated successfully!', 'success');
      } else {
        showAlert(data.error || 'Failed to generate content', 'danger');
      }
    } catch (error) {
      console.error('Error generating post:', error);
      showAlert('Network error. Please try again.', 'danger');
    } finally {
      // Hide loading state
      isGenerating = false;
      generateBtn.disabled = false;
      loadingIndicator.classList.add('d-none');
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

  // Initialize
  fetchTemplateCategories();
  
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