document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  const token = localStorage.getItem('token');
  if (token) {
    // If on login or register page, redirect to dashboard
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('register.html')) {
      window.location.href = 'dashboard.html';
    }
  }
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Navbar scroll effect
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('shadow');
        navbar.style.padding = '10px 0';
      } else {
        navbar.classList.remove('shadow');
        navbar.style.padding = '15px 0';
      }
    });
  }
  
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Simple form validation for landing page forms
  const emailForms = document.querySelectorAll('.email-signup-form');
  if (emailForms.length > 0) {
    emailForms.forEach(form => {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const emailInput = this.querySelector('input[type="email"]');
        const successMessage = this.querySelector('.success-message');
        
        if (emailInput && emailInput.value) {
          // Hide form and show success message
          this.querySelector('.form-content').style.display = 'none';
          if (successMessage) {
            successMessage.style.display = 'block';
          }
        }
      });
    });
  }
  
  // Workflow steps interaction
  const workflowSteps = document.querySelectorAll('.step');
  if (workflowSteps.length > 0) {
    workflowSteps.forEach((step, index) => {
      step.addEventListener('click', () => {
        // Remove active class from all steps
        workflowSteps.forEach(s => s.classList.remove('active'));
        
        // Add active class to current step and all previous steps
        for (let i = 0; i <= index; i++) {
          workflowSteps[i].classList.add('active');
        }
      });
    });
  }
}); 