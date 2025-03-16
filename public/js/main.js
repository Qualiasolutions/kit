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
}); 