// Custom Auth Service - non-Firebase implementation
class AuthService {
  constructor() {
    // API base URL
    this.API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? '' // Empty for local development (relative path)
      : '';
      
    // Local cached user
    this._currentUser = null;
    
    // Initialize user from localStorage
    this._initUser();
  }
  
  // Initialize user from localStorage
  _initUser() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this._currentUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
      }
    }
  }
  
  // Register with email/password
  async createUserWithEmailAndPassword(email, password, name) {
    const response = await fetch(`${this.API_URL}/api/auth/register`, {
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
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    // Store user info and token
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Update current user
    this._currentUser = data.user;
    
    return {
      user: data.user
    };
  }
  
  // Sign in with email/password
  async signInWithEmailAndPassword(email, password) {
    const response = await fetch(`${this.API_URL}/api/auth/login`, {
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
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Store user info and token
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Update current user
    this._currentUser = data.user;
    
    return {
      user: data.user
    };
  }
  
  // Sign out
  async signOut() {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear current user
    this._currentUser = null;
    
    return true;
  }
  
  // Get current user
  getCurrentUser() {
    return this._currentUser;
  }
  
  // Check if user is signed in
  isSignedIn() {
    return this._currentUser !== null;
  }
  
  // Get ID token
  async getIdToken() {
    return localStorage.getItem('token');
  }
}

// Create auth instance
const auth = new AuthService();

// Export everything needed
export { 
  auth
};

// Mock Google Auth Provider
class GoogleAuthProvider {
  constructor() {
    this.scopes = [];
  }
  
  addScope(scope) {
    this.scopes.push(scope);
    return this;
  }
}

// Create wrapper for compatibility
const signInWithPopup = async (auth, provider) => {
  return auth.signInWithPopup(provider);
}; 