/**
 * Broadstreet RFC - Admin Panel JavaScript
 * Handles all admin operations, API calls, and Google Sign-In authentication
 */

const AdminApp = (function () {
  // Configuration
  let config = {
    apiUrl: '',
    googleToken: '',
    userEmail: '',
    userName: '',
    userAvatar: '',
  };
  
  // Google Sign-In Client ID - Create at https://console.cloud.google.com
  // Go to APIs & Services → Credentials → Create OAuth 2.0 Client ID
  const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';  // Replace with your Client ID
  
  // Google Apps Script URL - Deploy your script and paste the URL here
  // Go to Extensions → Apps Script → Deploy → New deployment
  const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL';  // Replace with your Apps Script URL

  let currentSection = 'news';
  let currentData = [];
  let isEditing = false;
  let editingRowIndex = null;
  let googleClient = null;

  // Field definitions for each section
  const fieldDefinitions = {
    news: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'text', required: true, placeholder: 'e.g., 1 Feb 2026' },
      { name: 'category', label: 'Category', type: 'text', required: true, placeholder: 'e.g., Match Report, Club News' },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true },
      { name: 'image', label: 'Image URL', type: 'url', required: false },
      { name: 'link', label: 'Link URL', type: 'url', required: false, placeholder: 'Leave # for no link' },
      { name: 'featured', label: 'Featured', type: 'select', options: ['false', 'true'], required: true },
    ],
    fixtures: [
      { name: 'date', label: 'Date', type: 'text', required: true, placeholder: 'e.g., Saturday 15 Feb 2026' },
      { name: 'time', label: 'Time', type: 'text', required: true, placeholder: 'e.g., 3:00 PM' },
      { name: 'home_team', label: 'Home Team', type: 'text', required: true },
      { name: 'away_team', label: 'Away Team', type: 'text', required: true },
      { name: 'venue', label: 'Venue', type: 'text', required: true },
      { name: 'competition', label: 'Competition', type: 'text', required: true, placeholder: 'e.g., Regional 2 Midlands East' },
      { name: 'home_score', label: 'Home Score', type: 'number', required: false },
      { name: 'away_score', label: 'Away Score', type: 'number', required: false },
      { name: 'status', label: 'Status', type: 'select', options: ['upcoming', 'completed', 'postponed'], required: true },
      { name: 'home_bp', label: 'Home Bonus Points', type: 'number', required: false },
      { name: 'away_bp', label: 'Away Bonus Points', type: 'number', required: false },
    ],
    sponsors: [
      { name: 'name', label: 'Sponsor Name', type: 'text', required: true },
      { name: 'tier', label: 'Tier', type: 'select', options: ['title', 'premium', 'partner'], required: true },
      { name: 'logo', label: 'Logo Path', type: 'text', required: true, placeholder: 'e.g., assets/logos/sponsor-1.svg' },
      { name: 'link', label: 'Website Link', type: 'url', required: false },
      { name: 'tagline', label: 'Tagline', type: 'text', required: false },
    ],
    players: [
      { name: 'name', label: 'Player Name', type: 'text', required: true },
      { name: 'position', label: 'Position', type: 'text', required: true },
      { name: 'number', label: 'Jersey Number', type: 'number', required: true },
      { name: 'image', label: 'Image URL', type: 'url', required: false },
      { name: 'height', label: 'Height', type: 'text', required: false, placeholder: 'e.g., 1.85m' },
      { name: 'weight', label: 'Weight', type: 'text', required: false, placeholder: 'e.g., 95kg' },
      { name: 'age', label: 'Age', type: 'number', required: false },
      { name: 'caps', label: 'Caps', type: 'number', required: false },
      { name: 'team', label: 'Team', type: 'text', required: true, placeholder: 'e.g., 1st XV' },
    ],
    hero: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Use | to split lines' },
      { name: 'subtitle', label: 'Subtitle', type: 'text', required: true },
      { name: 'image', label: 'Background Image', type: 'text', required: true, placeholder: 'assets/photos/...' },
      { name: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
      { name: 'cta_link', label: 'CTA Button Link', type: 'text', required: false },
      { name: 'cta2_text', label: 'Secondary CTA Text', type: 'text', required: false },
      { name: 'cta2_link', label: 'Secondary CTA Link', type: 'text', required: false },
    ],
    standings: [
      // Read-only, displayed as table only
    ],
  };

  // Initialize
  function init() {
    setupEventListeners();
    initGoogleSignIn();
    checkAuth();
  }

  function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Navigation buttons
    document.querySelectorAll('.admin-nav-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        switchSection(section);
      });
    });
    
    // Set API URL from constant
    config.apiUrl = APPS_SCRIPT_URL;
  }

  /**
   * Initialize Google Sign-In
   */
  function initGoogleSignIn() {
    // Wait for Google Identity Services to load
    if (typeof google === 'undefined') {
      setTimeout(initGoogleSignIn, 100);
      return;
    }
    
    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
        auto_select: true,
      });
      
      // Render the Google Sign-In button
      google.accounts.id.renderButton(
        document.getElementById('googleSignInBtn'),
        {
          theme: 'outline',
          size: 'large',
          width: 300,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        }
      );
      
      // Show One Tap prompt if user hasn't logged in
      const savedToken = localStorage.getItem('admin_google_token');
      if (!savedToken) {
        google.accounts.id.prompt();
      }
    } catch (error) {
      console.error('Google Sign-In initialization error:', error);
    }
  }

  /**
   * Handle Google Sign-In callback
   */
  async function handleGoogleSignIn(response) {
    if (!response.credential) {
      showLoginError('Google Sign-In failed. Please try again.');
      return;
    }
    
    // Decode the JWT token to get user info
    const payload = decodeJwt(response.credential);
    
    config.googleToken = response.credential;
    config.userEmail = payload.email;
    config.userName = payload.name || payload.email;
    config.userAvatar = payload.picture || '';
    
    // Set API URL from constant
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL') {
      showLoginError('Please configure APPS_SCRIPT_URL in admin.js');
      return;
    }
    config.apiUrl = APPS_SCRIPT_URL;
    
    // Show loading
    showLoginLoading(true);
    
    // Verify with backend
    try {
      const result = await apiCall('checkAuth', null, {});
      
      if (result.success) {
        // Save session
        localStorage.setItem('admin_api_url', APPS_SCRIPT_URL);
        localStorage.setItem('admin_google_token', response.credential);
        localStorage.setItem('admin_user_email', config.userEmail);
        localStorage.setItem('admin_user_name', config.userName);
        localStorage.setItem('admin_user_avatar', config.userAvatar);
        
        showDashboard();
        loadCurrentSection();
        showToast(`Welcome, ${config.userName}!`, 'success');
      } else {
        showLoginError(result.error || 'Access denied. Your email is not authorized.');
      }
    } catch (error) {
      showLoginError('Connection failed: ' + error.message);
    }
    
    showLoginLoading(false);
  }

  /**
   * Decode JWT token payload
   */
  function decodeJwt(token) {
    try {
      const parts = token.split('.');
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload));
    } catch (e) {
      return {};
    }
  }

  function checkAuth() {
    // Always use the configured URL
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL') {
      showLogin();
      return;
    }
    
    const savedToken = localStorage.getItem('admin_google_token');
    const savedEmail = localStorage.getItem('admin_user_email');
    const savedName = localStorage.getItem('admin_user_name');
    const savedAvatar = localStorage.getItem('admin_user_avatar');

    if (savedToken) {
      config.apiUrl = APPS_SCRIPT_URL;
      config.googleToken = savedToken;
      config.userEmail = savedEmail;
      config.userName = savedName;
      config.userAvatar = savedAvatar;
      
      // Verify token is still valid
      verifyAndShowDashboard();
    } else {
      showLogin();
    }
  }
  
  async function verifyAndShowDashboard() {
    try {
      const result = await apiCall('checkAuth', null, {});
      if (result.success) {
        showDashboard();
        loadCurrentSection();
      } else {
        // Token expired or invalid
        handleLogout();
        showLoginError('Session expired. Please sign in again.');
      }
    } catch (error) {
      // Try to show dashboard anyway - might be network issue
      showDashboard();
      loadCurrentSection();
    }
  }

  function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    showLoginLoading(false);
  }

  function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    // Update user info in header
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) {
      userNameEl.textContent = config.userName || config.userEmail;
    }
    
    if (userAvatarEl && config.userAvatar) {
      userAvatarEl.src = config.userAvatar;
      userAvatarEl.style.display = 'block';
    } else if (userAvatarEl) {
      userAvatarEl.style.display = 'none';
    }
  }
  
  function showLoginError(message) {
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }
  
  function showLoginLoading(show) {
    const loadingEl = document.getElementById('loginLoading');
    const formEl = document.getElementById('apiUrlStep');
    
    if (loadingEl) {
      loadingEl.style.display = show ? 'block' : 'none';
    }
    if (formEl) {
      formEl.style.display = show ? 'none' : 'block';
    }
    
    const errorEl = document.getElementById('loginError');
    if (errorEl && show) {
      errorEl.style.display = 'none';
    }
  }

  function handleLogout() {
    // Clear stored data
    localStorage.removeItem('admin_api_url');
    localStorage.removeItem('admin_google_token');
    localStorage.removeItem('admin_user_email');
    localStorage.removeItem('admin_user_name');
    localStorage.removeItem('admin_user_avatar');
    
    config.apiUrl = '';
    config.googleToken = '';
    config.userEmail = '';
    config.userName = '';
    config.userAvatar = '';
    
    // Revoke Google session
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.disableAutoSelect();
    }
    
    showLogin();
    showToast('Logged out successfully', 'info');
  }

  function switchSection(section) {
    currentSection = section;

    // Update nav
    document.querySelectorAll('.admin-nav-item').forEach((btn) => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Hide all sections
    document.querySelectorAll('.admin-section').forEach((sec) => {
      sec.style.display = 'none';
    });

    // Show current section
    document.getElementById(`section-${section}`).style.display = 'block';

    loadCurrentSection();
  }

  async function loadCurrentSection() {
    showLoading();
    try {
      const result = await apiCall('read', currentSection, {});
      if (result.success) {
        currentData = result.data || [];
        renderTable(currentSection, currentData);
        hideLoading();
      } else {
        showError(result.error || 'Failed to load data');
      }
    } catch (error) {
      showError('Error loading data: ' + error.message);
    }
  }

  function renderTable(section, data) {
    const containerId = `${section}Table`;
    const container = document.getElementById(containerId);

    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p>No data available. Click "Add" to create your first entry.</p>
        </div>
      `;
      return;
    }

    // Get fields
    const fields = fieldDefinitions[section] || [];
    const headers = fields.map((f) => f.label);

    // Build table
    let tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join('')}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach((row, index) => {
      tableHtml += '<tr>';
      fields.forEach((field) => {
        let value = row[field.name] || '';
        // Truncate long text
        if (typeof value === 'string' && value.length > 50) {
          value = value.substring(0, 50) + '...';
        }
        tableHtml += `<td>${escapeHtml(String(value))}</td>`;
      });

      const isReadOnly = fieldDefinitions.READ_ONLY_TABS && 
                         fieldDefinitions.READ_ONLY_TABS.indexOf(section) !== -1;

      tableHtml += `
        <td>
          <div class="table-actions">
            ${!isReadOnly ? `
              <button class="btn-edit" onclick="AdminApp.editItem(${index})" title="Edit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button class="btn-delete" onclick="AdminApp.deleteItem(${index})" title="Delete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            ` : ''}
          </div>
        </td>
      `;
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    container.innerHTML = tableHtml;
  }

  function showAddForm(section) {
    isEditing = false;
    editingRowIndex = null;
    const fields = fieldDefinitions[section];
    const formHtml = buildForm(fields, {});

    document.getElementById('modalTitle').textContent = `Add ${capitalize(section)}`;
    document.getElementById('itemForm').innerHTML = formHtml;
    document.getElementById('formModal').style.display = 'flex';
  }

  function editItem(index) {
    isEditing = true;
    editingRowIndex = index;
    const item = currentData[index];
    const fields = fieldDefinitions[currentSection];
    const formHtml = buildForm(fields, item);

    document.getElementById('modalTitle').textContent = `Edit ${capitalize(currentSection)}`;
    document.getElementById('itemForm').innerHTML = formHtml;
    document.getElementById('formModal').style.display = 'flex';
  }

  function buildForm(fields, data) {
    let html = '';
    fields.forEach((field) => {
      const value = data[field.name] || '';
      html += `<div class="form-group">`;
      html += `<label for="field_${field.name}">${field.label}${field.required ? ' *' : ''}</label>`;

      if (field.type === 'textarea') {
        html += `<textarea id="field_${field.name}" name="${field.name}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}">${escapeHtml(String(value))}</textarea>`;
      } else if (field.type === 'select') {
        html += `<select id="field_${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>`;
        field.options.forEach((opt) => {
          const selected = String(value) === opt ? 'selected' : '';
          html += `<option value="${opt}" ${selected}>${opt}</option>`;
        });
        html += `</select>`;
      } else {
        html += `<input type="${field.type}" id="field_${field.name}" name="${field.name}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}" value="${escapeHtml(String(value))}">`;
      }

      html += `</div>`;
    });
    return html;
  }

  async function submitForm() {
    const form = document.getElementById('itemForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // If editing, include row index
    if (isEditing && editingRowIndex !== null) {
      data._rowIndex = currentData[editingRowIndex]._rowIndex;
    }

    showLoading();
    try {
      const action = isEditing ? 'update' : 'create';
      const result = await apiCall(action, currentSection, data);

      if (result.success) {
        showToast(isEditing ? 'Updated successfully!' : 'Created successfully!', 'success');
        closeModal();
        await loadCurrentSection();
      } else {
        showError(result.error || 'Operation failed');
      }
    } catch (error) {
      showError('Error: ' + error.message);
    }
  }

  async function deleteItem(index) {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    const item = currentData[index];
    showLoading();

    try {
      const result = await apiCall('delete', currentSection, {
        _rowIndex: item._rowIndex,
      });

      if (result.success) {
        showToast('Deleted successfully!', 'success');
        await loadCurrentSection();
      } else {
        showError(result.error || 'Delete failed');
      }
    } catch (error) {
      showError('Error: ' + error.message);
    }
  }

  function closeModal() {
    document.getElementById('formModal').style.display = 'none';
  }

  // API call helper - uses Google token for authentication
  async function apiCall(action, tab, data) {
    const payload = {
      action,
      tab,
      googleToken: config.googleToken,  // Use Google token instead of password
      ...data,
    };

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  // UI helpers
  function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
    document.querySelectorAll('.admin-section').forEach((s) => (s.style.display = 'none'));
  }

  function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById(`section-${currentSection}`).style.display = 'block';
  }

  function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.querySelector('.error-message').textContent = message;
    document.querySelectorAll('.admin-section').forEach((s) => (s.style.display = 'none'));
    
    // Also show in login screen if applicable
    const loginError = document.getElementById('loginError');
    if (loginError) {
      loginError.textContent = message;
      loginError.style.display = 'block';
    }
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Public API
  return {
    init,
    showAddForm,
    editItem,
    deleteItem,
    submitForm,
    closeModal,
    loadCurrentSection,
  };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => AdminApp.init());
