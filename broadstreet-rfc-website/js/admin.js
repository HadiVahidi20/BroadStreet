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
  const GOOGLE_CLIENT_ID = '113530727392-71pcmuk8sbh1n8o14muuviq0ldlujbp3.apps.googleusercontent.com';  // Replace with your Client ID
  
  // Google Apps Script URL - Deploy your script and paste the URL here
  // Go to Extensions → Apps Script → Deploy → New deployment
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw9ubtgljqkSSownb_tXeMYP3AIOM00N7mxHrvgi-DH6jvscveeEUA8qcdonTg_krtrmA/exec';

  let currentSection = 'news';
  let currentData = [];
  let currentHeaders = [];
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
      { name: 'first_name', label: 'First Name', type: 'text', required: false },
      { name: 'surname', label: 'Surname', type: 'text', required: false },
      { name: 'nickname', label: 'Nickname', type: 'text', required: false },
      { name: 'position', label: 'Position', type: 'text', required: true },
      { name: 'position_category', label: 'Position Category', type: 'text', required: false },
      { name: 'number', label: 'Jersey Number', type: 'number', required: true },
      { name: 'image', label: 'Image URL', type: 'url', required: false },
      { name: 'height', label: 'Height', type: 'text', required: false, placeholder: 'e.g., 1.85m' },
      { name: 'height_cm', label: 'Height CM', type: 'text', required: false, placeholder: 'e.g., 185' },
      { name: 'weight', label: 'Weight', type: 'text', required: false, placeholder: 'e.g., 95kg' },
      { name: 'age', label: 'Age', type: 'number', required: false },
      { name: 'caps', label: 'Caps', type: 'number', required: false },
      { name: 'team', label: 'Team', type: 'text', required: true, placeholder: 'e.g., 1st XV' },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'text', required: false, placeholder: 'e.g., 05/08/1991' },
      { name: 'birthplace', label: 'Birthplace', type: 'text', required: false },
      { name: 'sponsor', label: 'Sponsor', type: 'text', required: false },
      { name: 'previous_club_1', label: 'Previous Club 1', type: 'text', required: false },
      { name: 'previous_club_2', label: 'Previous Club 2', type: 'text', required: false },
      { name: 'coach_age_group', label: 'Coach Age Group', type: 'text', required: false },
      { name: 'seasons_at_broadstreet', label: 'Seasons at Broadstreet', type: 'text', required: false },
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
      // Dynamic headers from sheet
    ],
    coaching: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text', required: true, placeholder: 'e.g., Head Coach' },
      { name: 'image', label: 'Image URL', type: 'url', required: false },
      { name: 'team', label: 'Team', type: 'text', required: true, placeholder: 'e.g., 1st XV' },
    ],
  };

  // Read-only tabs (none for now; standings is manually editable)
  const READ_ONLY_TABS = [];
  const BROADSTREET_KEY = 'broadstreet';

  // Initialize
  function init() {
    setupEventListeners();
    initGoogleSignIn();
    checkAuth();
  }

  function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Sidebar navigation buttons
    document.querySelectorAll('.admin-nav-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        switchSection(section);
      });
    });
    
    // Mobile tab bar buttons
    document.querySelectorAll('.mobile-tab').forEach((btn) => {
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

    // Update sidebar nav
    document.querySelectorAll('.admin-nav-item').forEach((btn) => {
      btn.classList.remove('active');
    });
    const sidebarBtn = document.querySelector(`.admin-nav-item[data-section="${section}"]`);
    if (sidebarBtn) sidebarBtn.classList.add('active');
    
    // Update mobile tab bar
    document.querySelectorAll('.mobile-tab').forEach((btn) => {
      btn.classList.remove('active');
    });
    const mobileBtn = document.querySelector(`.mobile-tab[data-section="${section}"]`);
    if (mobileBtn) mobileBtn.classList.add('active');

    // Hide all sections
    document.querySelectorAll('.admin-section').forEach((sec) => {
      sec.style.display = 'none';
    });

    // Show current section
    const sectionEl = document.getElementById(`section-${section}`);
    if (sectionEl) sectionEl.style.display = 'block';

    loadCurrentSection();
  }

  function normalizeTeamKey(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\brfc\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function pad2(n) {
    return n < 10 ? `0${n}` : String(n);
  }

  function normalizeTimeDisplay(value) {
    if (value === null || value === undefined) return '';
    const text = String(value).trim();
    if (!text) return '';

    let m = text.match(/^(?:1899-12-(?:30|31)|1900-01-0[01])T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?Z?$/i);
    if (m) return `${m[1]}:${m[2]}`;

    m = text.match(/^(\d{1,2}):(\d{2})$/);
    if (m) return `${pad2(parseInt(m[1], 10))}:${pad2(parseInt(m[2], 10))}`;

    m = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m) {
      let hour = parseInt(m[1], 10);
      const minute = parseInt(m[2], 10);
      const ampm = m[3].toUpperCase();
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      return `${pad2(hour)}:${pad2(minute)}`;
    }

    m = text.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}`;

    const d = new Date(text);
    if (!isNaN(d.getTime())) {
      const useUtc = /z$/i.test(text) || /[+-]\d{2}:\d{2}$/.test(text);
      const hh = useUtc ? d.getUTCHours() : d.getHours();
      const mm = useUtc ? d.getUTCMinutes() : d.getMinutes();
      return `${pad2(hh)}:${pad2(mm)}`;
    }

    return text;
  }

  function isBroadstreetFixtureRow(row) {
    if (!row) return false;
    const home = normalizeTeamKey(row.home_team);
    const away = normalizeTeamKey(row.away_team);
    return home.indexOf(BROADSTREET_KEY) !== -1 || away.indexOf(BROADSTREET_KEY) !== -1;
  }

  function formatLabelFromFieldName(name) {
    return String(name || '')
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function inferDynamicFieldType(name, sampleValue) {
    const key = String(name || '').toLowerCase();
    if (key === 'highlight' || key === 'featured') {
      return { type: 'select', options: ['false', 'true'] };
    }

    if (
      /(^position$|^played$|^won$|^drawn$|^lost$|^points$|^pf$|^pa$|^pd$|^tb$|^lb$|^bp$|_score$|_bp$)/.test(key)
    ) {
      return { type: 'number' };
    }

    if (typeof sampleValue === 'number') {
      return { type: 'number' };
    }

    return { type: 'text' };
  }

  function buildDynamicFields(headers, data) {
    let names = [];

    if (Array.isArray(headers) && headers.length > 0) {
      names = headers.filter((h) => String(h || '').trim() !== '' && h !== '_rowIndex');
    } else if (Array.isArray(data) && data.length > 0) {
      names = Object.keys(data[0]).filter((k) => k !== '_rowIndex');
    }

    return names.map((name) => {
      const sampleValue = Array.isArray(data) && data.length > 0 ? data[0][name] : '';
      const inferred = inferDynamicFieldType(name, sampleValue);
      return {
        name,
        label: formatLabelFromFieldName(name),
        type: inferred.type,
        options: inferred.options || undefined,
        required: false,
      };
    });
  }

  function getSectionFields(section, data) {
    const configured = fieldDefinitions[section] || [];
    if (configured.length > 0) return configured;
    return buildDynamicFields(currentHeaders, data || currentData);
  }

  async function loadCurrentSection() {
    showLoading();
    try {
      const result = await apiCall('read', currentSection, {});
      if (result.success) {
        currentHeaders = result.headers || [];
        const allRows = result.data || [];
        currentData =
          currentSection === 'fixtures'
            ? allRows.filter((row) => isBroadstreetFixtureRow(row))
            : allRows;
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
      const emptyText =
        section === 'fixtures'
          ? 'No Broadstreet fixtures found. Add one or run RFU sync.'
          : 'No data available. Click "Add" to create your first entry.';
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p>${emptyText}</p>
        </div>
      `;
      return;
    }

    const isReadOnly = READ_ONLY_TABS.indexOf(section) !== -1;
    const fields = getSectionFields(section, data);
    const headers = fields.map((f) => f.label);

    // Build table
    let tableHtml = `
      <table class="data-table">
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join('')}
            ${!isReadOnly ? '<th class="actions-col">Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach((row, index) => {
      tableHtml += '<tr>';
      fields.forEach((field) => {
        let value = row[field.name] || '';
        if (section === 'fixtures' && field.name === 'time') {
          value = normalizeTimeDisplay(value);
        }
        // Truncate long text
        if (typeof value === 'string' && value.length > 50) {
          value = value.substring(0, 50) + '...';
        }
        tableHtml += `<td title="${escapeHtml(String(row[field.name] || ''))}">${escapeHtml(String(value))}</td>`;
      });

      if (!isReadOnly) {
        tableHtml += `
          <td class="actions-col">
            <div class="table-actions">
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
            </div>
          </td>
        `;
      }
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    container.innerHTML = tableHtml;
  }

  function showAddForm(section) {
    isEditing = false;
    editingRowIndex = null;
    const fields = getSectionFields(section, currentData);
    if (!fields.length) {
      showError('No editable columns found for this section.');
      return;
    }
    const formHtml = buildForm(fields, {});

    document.getElementById('modalTitle').textContent = `Add ${capitalize(section)}`;
    document.getElementById('itemForm').innerHTML = formHtml;
    document.getElementById('formModal').style.display = 'flex';
  }

  function editItem(index) {
    isEditing = true;
    editingRowIndex = index;
    const item = currentData[index];
    const fields = getSectionFields(currentSection, currentData);
    if (!fields.length) {
      showError('No editable columns found for this section.');
      return;
    }
    const formHtml = buildForm(fields, item);

    document.getElementById('modalTitle').textContent = `Edit ${capitalize(currentSection)}`;
    document.getElementById('itemForm').innerHTML = formHtml;
    document.getElementById('formModal').style.display = 'flex';
  }

  function buildForm(fields, data) {
    let html = '';
    fields.forEach((field) => {
      let value = data[field.name] || '';
      if (currentSection === 'fixtures' && field.name === 'time') {
        value = normalizeTimeDisplay(value);
      }
      const fieldType = field.type || 'text';
      html += `<div class="form-group">`;
      html += `<label for="field_${field.name}">${field.label}${field.required ? ' *' : ''}</label>`;

      if (fieldType === 'textarea') {
        html += `<textarea id="field_${field.name}" name="${field.name}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}">${escapeHtml(String(value))}</textarea>`;
      } else if (fieldType === 'select') {
        html += `<select id="field_${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>`;
        (field.options || []).forEach((opt) => {
          const selected = String(value) === opt ? 'selected' : '';
          html += `<option value="${opt}" ${selected}>${opt}</option>`;
        });
        html += `</select>`;
      } else {
        html += `<input type="${fieldType}" id="field_${field.name}" name="${field.name}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}" value="${escapeHtml(String(value))}">`;
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

  async function syncRfuFixtures() {
    const confirmed = confirm(
      'Sync fixtures from RFU calendar now?\n\nThis keeps existing scores/results and only updates fixture details.'
    );
    if (!confirmed) return;

    showLoading();

    try {
      const result = await apiCall('syncRfuFixtures', 'fixtures', {});
      if (!result.success) {
        showError(result.error || 'RFU sync failed');
        return;
      }

      const summary = result.summary || {};
      const added = Number(summary.added || 0);
      const updated = Number(summary.updated || 0);
      const totalFeeds = Number(summary.feed_sources_total || 0);
      const successFeeds = Number(summary.feed_sources_success || 0);
      const failedFeeds = Number(summary.feed_sources_failed || 0);
      const fetchedRaw = Number(summary.fetched_raw || summary.fetched || 0);
      const fetchedDeduped = Number(summary.fetched_deduped || summary.fetched || 0);
      const removedDuplicates = Number(summary.removed_duplicates || 0);

      const resultsUpdated = Number(summary.results_updated || 0);
      const resultsMatched = Number(summary.results_matched || 0);
      const resultsFetched = Number(summary.results_fetched || 0);
      const resultsError = summary.results_error || '';

      const parts = [`RFU sync complete: ${added} added`, `${updated} updated`];
      if (totalFeeds > 0) {
        parts.push(`feeds ${successFeeds}/${totalFeeds}`);
      }
      if (fetchedRaw > fetchedDeduped) {
        parts.push(`deduped ${fetchedRaw - fetchedDeduped}`);
      }
      if (removedDuplicates > 0) {
        parts.push(`removed old duplicates ${removedDuplicates}`);
      }

      showToast(parts.join(', ') + '.', failedFeeds > 0 ? 'info' : 'success');

      if (resultsFetched > 0) {
        showToast(
          `Results sync: ${resultsFetched} fetched, ${resultsMatched} matched, ${resultsUpdated} scores updated.`,
          resultsUpdated > 0 ? 'success' : 'info'
        );
      } else if (resultsError) {
        showToast('Results sync failed: ' + resultsError, 'error');
      }
      if (failedFeeds > 0) {
        showToast(
          `${failedFeeds} feed(s) failed. Check Apps Script logs for details.`,
          'error'
        );
      }
      await loadCurrentSection();
    } catch (error) {
      showError('Error syncing RFU fixtures: ' + error.message);
    }
  }

  // API call helper - uses Google token for authentication
  // Uses GET method to avoid CORS redirect issues with Google Apps Script
  async function apiCall(action, tab, data) {
    const payload = {
      action,
      tab,
      googleToken: config.googleToken,
      ...data,
    };

    // Encode payload as base64 URL parameter to avoid CORS preflight
    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const url = config.apiUrl + '?data=' + encodeURIComponent(encodedData);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
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
    syncRfuFixtures,
    closeModal,
    loadCurrentSection,
  };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => AdminApp.init());
