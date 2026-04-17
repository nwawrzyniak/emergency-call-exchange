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
  document.getElementById('leaderboardSection').classList.add('hidden');
  document.getElementById('profileSection').classList.add('hidden');

  // Show selected section
  document.getElementById(section + 'Section').classList.remove('hidden');

  // Load profile data if profile section is being shown
  if (section === 'profile') {
    loadProfile();
  }

  // Load availability state when the available calls section is shown
  if (section === 'availableCalls') {
    loadAvailabilityState();
  }

  // Close burger menu if open
  closeBurgerMenu();
}

function toggleBurgerMenu() {
  const btn = document.getElementById('burger-btn');
  const nav = document.getElementById('nav-buttons');

  const isOpen = nav.classList.contains('open');

  if (isOpen) {
    closeBurgerMenu();
  } else {
    nav.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    nav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeBurgerMenu() {
  const btn = document.getElementById('burger-btn');
  const nav = document.getElementById('nav-buttons');

  if (!btn || !nav) return;

  nav.classList.remove('open');
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
  nav.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Close overlay on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeBurgerMenu();
});

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

async function updateProfile(profileData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(API_BASE + '/api/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      showAlert('Profile updated successfully', 'success');
    } else {
      showAlert(data.error || 'Profile update failed');
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
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      login(email, password);
    });
  }

  if (registerForm) {
    // Live validation: warn when password is too short
    const regPassword = document.getElementById('regPassword');
    if (regPassword) {
      regPassword.addEventListener('input', function () {
        const errorEl = document.getElementById('regPasswordError');
        if (this.value.length > 0 && this.value.length < 6) {
          errorEl.style.display = 'block';
          this.setCustomValidity('Password must be at least 6 characters.');
        } else {
          errorEl.style.display = 'none';
          this.setCustomValidity('');
        }
      });
    }

    // Live validation: check passwords match as the user types in the confirm field
    const regPasswordConfirm = document.getElementById('regPasswordConfirm');
    if (regPasswordConfirm) {
      regPasswordConfirm.addEventListener('input', function () {
        const password = document.getElementById('regPassword').value;
        const errorEl = document.getElementById('regPasswordConfirmError');
        if (this.value && this.value !== password) {
          errorEl.style.display = 'block';
          this.setCustomValidity('Passwords do not match.');
        } else {
          errorEl.style.display = 'none';
          this.setCustomValidity('');
        }
      });
    }

    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('regPasswordConfirm').value;
      const errorEl = document.getElementById('regPasswordConfirmError');

      if (password !== confirmPassword) {
        errorEl.style.display = 'block';
        document.getElementById('regPasswordConfirm').setCustomValidity('Passwords do not match.');
        document.getElementById('regPasswordConfirm').focus();
        return;
      }

      errorEl.style.display = 'none';
      document.getElementById('regPasswordConfirm').setCustomValidity('');

      const userData = {
        userName: document.getElementById('regUserName').value,
        email: document.getElementById('regEmail').value,
        password,
        phoneNumber: document.getElementById('regPhone').value,
        dateOfBirth: document.getElementById('regDateOfBirth').value,
        gender: document.getElementById('regGender').value
      };
      register(userData);
    });
  }

  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const profileData = {
        phoneNumber: document.getElementById('profilePhone').value,
        dateOfBirth: document.getElementById('profileDateOfBirth').value
      };
      updateProfile(profileData);
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

function loadProfile() {
  const userData = JSON.parse(localStorage.getItem('user'));
  if (userData) {
    // Populate profile fields
    document.getElementById('profileUserName').textContent = userData.userName || '';
    document.getElementById('profileEmail').innerHTML = userData.email || '';
    if (userData.dateOfBirth) {
      const date = new Date(userData.dateOfBirth);
      document.getElementById('profileDateOfBirth').value = date.toISOString().split('T')[0];
    }
    document.getElementById('profileGender').innerHTML = userData.gender || '';
    document.getElementById('profileRole').innerHTML = userData.role || '';

    // Populate phone number if available (from stored profile data)
    const token = localStorage.getItem('token');
    if (token) {
      fetch(API_BASE + '/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            document.getElementById('profilePhone').value = data.user.phoneNumber || '';
          }
        })
        .catch(err => console.error('Error loading profile:', err));
    }
  }
}

// ------------------------------------------------------------
// Availability: load state from server and sync the UI
// ------------------------------------------------------------
async function loadAvailabilityState() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(API_BASE + '/api/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return;

    const data = await response.json();
    const user = data.user;
    if (!user) return;

    // Sync toggle
    const toggle = document.getElementById('availabilityToggle');
    if (toggle) {
      toggle.checked = !!user.isAvailable;
    }

    // Show/hide settings panel to match saved state
    const settingsPanel = document.getElementById('availabilitySettings');
    if (settingsPanel) {
      if (user.isAvailable) {
        settingsPanel.classList.remove('hidden');
      } else {
        settingsPanel.classList.add('hidden');
      }
    }

    // Restore saved gender preferences
    if (Array.isArray(user.callForGenders)) {
      document.querySelectorAll('.genderPref').forEach(cb => {
        cb.checked = user.callForGenders.includes(cb.value);
      });
    }

    // Restore saved age range
    const ageMin = document.getElementById('callAgeMin');
    const ageMax = document.getElementById('callAgeMax');
    if (ageMin) ageMin.value = user.callForAgeMin ?? 18;
    if (ageMax) ageMax.value = user.callForAgeMax ?? 120;

  } catch (err) {
    console.error('Error loading availability state:', err);
  }
}

// ------------------------------------------------------------
// Toggle availability on/off and immediately persist to server
// ------------------------------------------------------------
async function toggleAvailability() {
  const toggle = document.getElementById('availabilityToggle');
  const isAvailable = toggle.checked;

  // Optimistically show/hide the settings panel
  const settingsPanel = document.getElementById('availabilitySettings');
  if (settingsPanel) {
    if (isAvailable) {
      settingsPanel.classList.remove('hidden');
    } else {
      settingsPanel.classList.add('hidden');
    }
  }

  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(API_BASE + '/api/users/availability', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isAvailable })
    });

    const data = await response.json();

    if (response.ok) {
      // Keep localStorage in sync so other parts of the app see the latest state
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      // Revert the toggle if the server rejected the change
      toggle.checked = !isAvailable;
      if (settingsPanel) {
        if (!isAvailable) {
          settingsPanel.classList.remove('hidden');
        } else {
          settingsPanel.classList.add('hidden');
        }
      }
      showAlert(data.error || 'Could not update availability');
    }
  } catch (err) {
    // Revert on network error
    toggle.checked = !isAvailable;
    showAlert('Network error — availability not saved');
  }
}

// ------------------------------------------------------------
// Save call preferences (gender filter + age range)
// ------------------------------------------------------------
async function saveCallPreferences() {
  const token = localStorage.getItem('token');
  if (!token) return;

  // Collect selected genders
  const selectedGenders = Array.from(document.querySelectorAll('.genderPref:checked'))
    .map(cb => cb.value);

  const ageMin = parseInt(document.getElementById('callAgeMin').value, 10) || 18;
  const ageMax = parseInt(document.getElementById('callAgeMax').value, 10) || 120;

  if (ageMin > ageMax) {
    showAlert('Minimum age cannot be greater than maximum age');
    return;
  }

  try {
    const response = await fetch(API_BASE + '/api/users/availability', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        callForGenders: selectedGenders,
        callForAgeMin: ageMin,
        callForAgeMax: ageMax
      })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      showAlert('Preferences saved', 'success');
    } else {
      showAlert(data.error || 'Could not save preferences');
    }
  } catch (err) {
    showAlert('Network error — preferences not saved');
  }
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
