/**
 * Broadstreet RFC - Google Apps Script Admin API
 * Provides CRUD operations for all sheet tabs via API endpoints
 * 
 * AUTHENTICATION: Google Sign-In (OAuth 2.0)
 * Only authorized Google accounts can access the admin panel.
 * 
 * ⚠️  IMPORTANT: After making changes to this script, you must REDEPLOY:
 *     Deploy → Manage deployments → Edit → Deploy (or New deployment)
 *     Without redeploying, changes will not take effect!
 * 
 * INSTALLATION:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Create a new file and paste this code
 * 4. Configure ALLOWED_EMAILS below with authorized Gmail addresses
 * 5. Deploy as Web App:
 *    - Click "Deploy" → "New deployment"
 *    - Type: "Web app"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (or "Anyone with link")
 *    - Click "Deploy"
 * 6. Copy the Web App URL and use it in your admin panel
 *
 * SECURITY: 
 * - Uses Google OAuth 2.0 for authentication
 * - Only emails in ALLOWED_EMAILS can access
 * - No passwords stored or transmitted
 * - CORS headers configured for cross-origin requests
 */

var CONFIG = {
  // ⚠️ IMPORTANT: Add authorized Gmail/Google Workspace email addresses here
  // Only these emails can access the admin panel
  ALLOWED_EMAILS: [
     "hadi@theherd.agency",      // Example: club admin
     "hadivahidi20@gmail.com",  // Example: webmaster
    // "your.email@gmail.com",            // Add your Gmail here
  ],
  
  // Allowed sheet tabs
  ALLOWED_TABS: ["news", "fixtures", "sponsors", "players", "hero", "standings", "coaching"],
  
  // Read-only tabs (auto-calculated)
  READ_ONLY_TABS: ["standings"]
};

/**
 * Main handler for GET and POST requests
 * 
 * NOTE: Google Apps Script Web Apps handle CORS automatically
 * when deployed with "Anyone" access. No custom headers needed.
 */
function doPost(e) {
  try {
    return handleRequest(e);
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString()
    }, 500);
  }
}

function doGet(e) {
  try {
    return handleRequest(e);
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString()
    }, 500);
  }
}

function handleRequest(e) {
  try {
    var params = e.parameter || {};
    var data = {};
    
    // Check if data is sent as base64-encoded JSON via GET parameter
    if (params.data) {
      try {
        var decoded = Utilities.newBlob(Utilities.base64Decode(params.data)).getDataAsString();
        data = JSON.parse(decoded);
      } catch (err) {
        return jsonResponse({ success: false, error: "Invalid data encoding: " + err.toString() }, 400);
      }
    }
    // Also support POST body for backward compatibility
    else if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        return jsonResponse({ success: false, error: "Invalid JSON" }, 400);
      }
    }
    // Fall back to URL parameters
    else {
      data = params;
    }
    
    // Check authentication via Google token
    var authResult = checkGoogleAuth(data);
    if (!authResult.success) {
      return jsonResponse({ success: false, error: authResult.error }, 401);
    }
    
    var action = data.action;
    var tab = data.tab;
    
    // Handle auth check action (for login verification)
    if (action === "checkAuth") {
      return jsonResponse({ 
        success: true, 
        message: "Authenticated",
        email: authResult.email,
        name: authResult.name
      });
    }
    
    // Validate tab
    if (!tab || CONFIG.ALLOWED_TABS.indexOf(tab) === -1) {
      return jsonResponse({ success: false, error: "Invalid tab: " + tab }, 400);
    }
    
    // Route action
    switch (action) {
      case "read":
        return handleRead(tab);
      case "create":
        return handleCreate(tab, data);
      case "update":
        return handleUpdate(tab, data);
      case "delete":
        return handleDelete(tab, data);
      case "batch":
        return handleBatch(tab, data);
      default:
        return jsonResponse({ success: false, error: "Invalid action: " + action }, 400);
    }
    
  } catch (error) {
    Logger.log("Error: " + error.toString());
    return jsonResponse({ success: false, error: error.toString() }, 500);
  }
}

/**
 * Check authentication via Google OAuth token
 */
function checkGoogleAuth(data) {
  // Check if Google token is provided
  if (!data.googleToken) {
    return { success: false, error: "No authentication token provided" };
  }
  
  // Verify the Google token
  var tokenResult = verifyGoogleToken(data.googleToken);
  
  if (!tokenResult.valid) {
    return { success: false, error: "Invalid or expired Google token: " + (tokenResult.error || "") };
  }
  
  // Check if email is in allowed list
  var email = tokenResult.email.toLowerCase();
  var isAllowed = CONFIG.ALLOWED_EMAILS.some(function(allowedEmail) {
    return allowedEmail.toLowerCase() === email;
  });
  
  if (!isAllowed) {
    Logger.log("Access denied for email: " + email);
    return { 
      success: false, 
      error: "Access denied. Your email (" + email + ") is not authorized. Contact the administrator." 
    };
  }
  
  return { 
    success: true, 
    email: tokenResult.email,
    name: tokenResult.name || tokenResult.email
  };
}

/**
 * Verify Google OAuth/ID token
 */
function verifyGoogleToken(token) {
  try {
    // First, try to verify as an access token
    var accessResult = verifyAccessToken(token);
    if (accessResult.valid) {
      return accessResult;
    }
    
    // If that fails, try as an ID token (JWT)
    var idResult = verifyIdToken(token);
    return idResult;
    
  } catch (e) {
    Logger.log("Token verification error: " + e.toString());
    return { valid: false, error: e.toString() };
  }
}

/**
 * Verify Google access token using tokeninfo endpoint
 */
function verifyAccessToken(token) {
  try {
    var url = "https://oauth2.googleapis.com/tokeninfo?access_token=" + encodeURIComponent(token);
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var code = response.getResponseCode();
    
    if (code === 200) {
      var data = JSON.parse(response.getContentText());
      return {
        valid: true,
        email: data.email,
        name: data.name || data.email,
        verified: data.email_verified === "true"
      };
    }
    
    return { valid: false };
  } catch (e) {
    return { valid: false, error: e.toString() };
  }
}

/**
 * Verify Google ID token (JWT)
 */
function verifyIdToken(idToken) {
  try {
    // Decode the JWT token
    var parts = idToken.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: "Invalid token format" };
    }
    
    // Decode payload (middle part) - handle URL-safe base64
    var payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    var decoded = Utilities.newBlob(Utilities.base64Decode(payload)).getDataAsString();
    var data = JSON.parse(decoded);
    
    // Check expiration
    var now = Math.floor(Date.now() / 1000);
    if (data.exp && data.exp < now) {
      return { valid: false, error: "Token expired" };
    }
    
    // Check issuer (should be Google)
    if (data.iss && data.iss !== "accounts.google.com" && data.iss !== "https://accounts.google.com") {
      return { valid: false, error: "Invalid token issuer" };
    }
    
    // Return email if present
    if (data.email) {
      return {
        valid: true,
        email: data.email,
        name: data.name || data.email,
        verified: data.email_verified === true
      };
    }
    
    return { valid: false, error: "No email in token" };
  } catch (e) {
    Logger.log("ID token verification error: " + e.toString());
    return { valid: false, error: e.toString() };
  }
}

/**
 * Read all data from a tab
 */
function handleRead(tabName) {
  var sheet = getSheet(tabName);
  if (!sheet) {
    return jsonResponse({ success: false, error: "Tab not found: " + tabName }, 404);
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 1) {
    return jsonResponse({ success: true, data: [] });
  }
  
  var headers = data[0];
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = {};
    row._rowIndex = i + 1; // Store row index for updates/deletes
    for (var j = 0; j < headers.length; j++) {
      row[String(headers[j])] = data[i][j];
    }
    rows.push(row);
  }
  
  return jsonResponse({ success: true, data: rows, headers: headers });
}

/**
 * Create a new row
 */
function handleCreate(tabName, data) {
  if (CONFIG.READ_ONLY_TABS.indexOf(tabName) !== -1) {
    return jsonResponse({ success: false, error: "Tab is read-only: " + tabName }, 403);
  }
  
  var sheet = getSheet(tabName);
  if (!sheet) {
    return jsonResponse({ success: false, error: "Tab not found: " + tabName }, 404);
  }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = [];
  
  for (var i = 0; i < headers.length; i++) {
    var header = String(headers[i]);
    newRow.push(data[header] || "");
  }
  
  sheet.appendRow(newRow);
  
  return jsonResponse({ success: true, message: "Row created successfully" });
}

/**
 * Update an existing row
 */
function handleUpdate(tabName, data) {
  if (CONFIG.READ_ONLY_TABS.indexOf(tabName) !== -1) {
    return jsonResponse({ success: false, error: "Tab is read-only: " + tabName }, 403);
  }
  
  var sheet = getSheet(tabName);
  if (!sheet) {
    return jsonResponse({ success: false, error: "Tab not found: " + tabName }, 404);
  }
  
  var rowIndex = parseInt(data._rowIndex, 10);
  if (!rowIndex || rowIndex < 2) {
    return jsonResponse({ success: false, error: "Invalid row index" }, 400);
  }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = [];
  
  for (var i = 0; i < headers.length; i++) {
    var header = String(headers[i]);
    rowData.push(data[header] !== undefined ? data[header] : "");
  }
  
  sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  
  return jsonResponse({ success: true, message: "Row updated successfully" });
}

/**
 * Delete a row
 */
function handleDelete(tabName, data) {
  if (CONFIG.READ_ONLY_TABS.indexOf(tabName) !== -1) {
    return jsonResponse({ success: false, error: "Tab is read-only: " + tabName }, 403);
  }
  
  var sheet = getSheet(tabName);
  if (!sheet) {
    return jsonResponse({ success: false, error: "Tab not found: " + tabName }, 404);
  }
  
  var rowIndex = parseInt(data._rowIndex, 10);
  if (!rowIndex || rowIndex < 2) {
    return jsonResponse({ success: false, error: "Invalid row index" }, 400);
  }
  
  sheet.deleteRow(rowIndex);
  
  return jsonResponse({ success: true, message: "Row deleted successfully" });
}

/**
 * Batch update - replace all data in a tab
 */
function handleBatch(tabName, data) {
  if (CONFIG.READ_ONLY_TABS.indexOf(tabName) !== -1) {
    return jsonResponse({ success: false, error: "Tab is read-only: " + tabName }, 403);
  }
  
  var sheet = getSheet(tabName);
  if (!sheet) {
    return jsonResponse({ success: false, error: "Tab not found: " + tabName }, 404);
  }
  
  if (!data.rows || !Array.isArray(data.rows)) {
    return jsonResponse({ success: false, error: "Invalid rows data" }, 400);
  }
  
  // Clear existing data (except header)
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  // Get headers
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Prepare new rows
  var newRows = [];
  for (var i = 0; i < data.rows.length; i++) {
    var rowObj = data.rows[i];
    var rowData = [];
    for (var j = 0; j < headers.length; j++) {
      var header = String(headers[j]);
      rowData.push(rowObj[header] || "");
    }
    newRows.push(rowData);
  }
  
  if (newRows.length > 0) {
    sheet.getRange(2, 1, newRows.length, headers.length).setValues(newRows);
  }
  
  return jsonResponse({ success: true, message: "Batch update completed" });
}

/**
 * Helper: Get sheet by name
 */
function getSheet(tabName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(tabName);
}

/**
 * Helper: Create JSON response
 * NOTE: Google Apps Script handles CORS automatically for deployed Web Apps.
 * ContentService does NOT support setHeader() - do not add custom headers.
 */
function jsonResponse(obj, statusCode) {
  var response = ContentService.createTextOutput(JSON.stringify(obj));
  response.setMimeType(ContentService.MimeType.JSON);
  return response;
}

/**
 * Get list of authorized emails (for debugging)
 */
function getAuthorizedEmails() {
  return CONFIG.ALLOWED_EMAILS;
}

/**
 * Add an email to the authorized list (run manually)
 * Usage: Run this function from Apps Script editor
 */
function addAuthorizedEmail() {
  var email = "new.email@example.com"; // Change this
  CONFIG.ALLOWED_EMAILS.push(email);
  Logger.log("Added: " + email);
  Logger.log("Current list: " + CONFIG.ALLOWED_EMAILS.join(", "));
}

/**
 * Test token verification (for debugging)
 */
function testTokenVerification() {
  var testToken = "YOUR_TEST_TOKEN_HERE";
  var result = verifyGoogleToken(testToken);
  Logger.log(JSON.stringify(result));
}
