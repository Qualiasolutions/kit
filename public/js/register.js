document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('register-form');
  const alertContainer = document.getElementById('alert-container');

  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
      showAlert('Passwords do not match', 'danger');
      return;
    }
    
    try {
      // Send registration request
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });
      
      // Check if the response is JSON before parsing
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text}`);
      }
      
      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Show success message and redirect
        showAlert('Registration successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'profile-setup.html';
        }, 1500);
      } else {
        showAlert(data.error || 'Registration failed', 'danger');
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