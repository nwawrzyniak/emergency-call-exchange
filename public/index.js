// API base URL
const API_BASE = '';

// Load external HTML components
async function loadComponents() {
  const components = document.querySelectorAll('[data-component]');
  for (const component of components) {
    const path = component.getAttribute('data-component');
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load ${path}`);
      const html = await response.text();
      component.innerHTML = html;
    } catch (error) {
      console.error(`Error loading component ${path}:`, error);
      component.innerHTML = `<p>Error loading component</p>`;
    }
  }
}

// Utility functions
function showAlert(message, type = 'error') {
  const alertDiv = document.getElementById('authAlert');
  alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  alertDiv.style.display = 'block';
  setTimeout(() => {
    alertDiv.style.display = 'none';
  }, 5000);
}

function showSection(section) {
  // Hide all sections
  document.getElementById('dashboardSection').classList.add('hidden');
  document.getElementById('myRequestsSection').classList.add('hidden');
  document.getElementById('availableCallsSection').classList.add('hidden');
  document.getElementById('profileSection').classList.add('hidden');

  // Show selected section
  document.getElementById(section + 'Section').classList.remove('hidden');
}

function switchAuthTab(tab) {
  const loginTab = document.querySelector('.tab-btn[onclick="switchAuthTab(\'login\')"]');
  const registerTab = document.querySelector('.tab-btn[onclick="switchAuthTab(\'register\')"]');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

// Auth functions
async function login(email, password) {
  try {
    const response = await fetch(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showApp();
      loadDashboard();
    } else {
      showAlert(data.error || 'Login failed');
    }
  } catch (error) {
    showAlert('Network error');
  }
}

async function register(userData) {
  try {
    const response = await fetch(API_BASE + '/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showApp();
      loadDashboard();
    } else {
      showAlert(data.error || 'Registration failed');
    }
  } catch (error) {
    showAlert('Network error');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showAuth();
}

function showAuth() {
  document.getElementById('authContainer').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('hidden');
}

function showApp() {
  document.getElementById('authContainer').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
}

// Attach form handlers after components are loaded
function attachFormHandlers() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      login(email, password);
    });
  }
  
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const userData = {
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        firstName: document.getElementById('regFirstName').value,
        lastName: document.getElementById('regLastName').value,
        phoneNumber: document.getElementById('regPhone').value,
        age: parseInt(document.getElementById('regAge').value),
        gender: document.getElementById('regGender').value
      };
      register(userData);
    });
  }
}

// Initialize - Load components first, then check auth state
loadComponents().then(() => {
  attachFormHandlers();
  if (localStorage.getItem('token')) {
    showApp();
    loadDashboard();
  } else {
    showAuth();
  }
});

// Placeholder for other functions
function loadDashboard() {
  // Load user stats, etc.
}

function toggleAvailability() {
  // Toggle availability
}

function saveCallPreferences() {
  // Save preferences
}

function closeRatingModal() {
  document.getElementById('ratingModal').classList.add('hidden');
}

function setRating(rating) {
  // Set rating
}

function submitRating() {
  // Submit rating
}
