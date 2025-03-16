document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('login-form');
  const alertContainer = document.getElementById('alert-container');

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      // Send login request
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Show success message and redirect
        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        showAlert(data.error || 'Login failed', 'danger');
      }
    } catch (error) {
      showAlert('Server error. Please try again later.', 'danger');
      console.error(error);
    }
  });
  
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