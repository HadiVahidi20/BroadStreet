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

var ADMIN_CONFIG = {
  // ⚠️ IMPORTANT: Add authorized Gmail/Google Workspace email addresses here
  // Only these emails can access the admin panel
  ALLOWED_EMAILS: [
     "hadi@theherd.agency",      // Example: club admin
     "hadivahidi20@gmail.com",  // Example: webmaster
    // "your.email@gmail.com",            // Add your Gmail here
  ],
  
  // Allowed sheet tabs
  ALLOWED_TABS: ["news", "fixtures", "sponsors", "players", "hero", "standings", "coaching"],
  
  // Read-only tabs
  // Standings is intentionally editable from admin for manual corrections.
  READ_ONLY_TABS: [],

  // RFU fixture sync
  RFU_ICS_URL: "",
  RFU_TEAM_FEEDS: [
    { team: "Market Harborough", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b2e81e21aff00022f9704/RFU.ics", logo: "https://images.englandrugby.com/club_images/13377.png" },
    { team: "Northampton Old Scouts", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b2ea6b22eb2000272b97c/RFU.ics", logo: "https://images.englandrugby.com/club_images/14907.png" },
    { team: "Broadstreet", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b2ee8e21aff00022f970d/RFU.ics", logo: "https://images.englandrugby.com/club_images/3366.png" },
    { team: "Bedford Athletic", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b2f75b22eb2000272b985/RFU.ics", logo: "https://images.englandrugby.com/club_images/1822.png" },
    { team: "Peterborough", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b2fa3b22eb2000272b98d/RFU.ics", logo: "https://images.englandrugby.com/club_images/16819.png" },
    { team: "Stamford", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b2fcfb22eb2000272b995/RFU.ics", logo: "https://images.englandrugby.com/club_images/20850.png" },
    { team: "Kettering", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b2ffdb22eb2000272b996/RFU.ics", logo: "https://images.englandrugby.com/club_images/11346.png" },
    { team: "Oadby Wyggestonians", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b3019b22eb2000272b999/RFU.ics", logo: "https://images.englandrugby.com/club_images/15254.png" },
    { team: "Olney", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b304ce21aff00022f972b/RFU.ics", logo: "https://images.englandrugby.com/club_images/16184.png" },
    { team: "Daventry", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b306fb22eb2000272b99f/RFU.ics", logo: "https://images.englandrugby.com/club_images/6224.png" },
    { team: "Old Coventrians", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b308be21aff00022f972e/RFU.ics", logo: "https://images.englandrugby.com/club_images/15578.png" },
    { team: "Wellingborough", icsUrl: "webcal://ics.ecal.com/ecal-sub/698b30a8b22eb2000272b9a3/RFU.ics", logo: "https://images.englandrugby.com/club_images/24604.png" }
  ],
  DEFAULT_FIXTURE_TIME: "3:00 PM",
  SYNC_TIME_ZONE: "Europe/London",
  AUTO_SYNC_WEEKDAY: "MONDAY",
  AUTO_SYNC_HOUR: 6,
  // RFU Game Management System (GMS) - used for fetching match results with scores
  RFU_GMS_TEAM_ID: 8763,    // Broadstreet 1st XV
  RFU_GMS_CLUB_ID: 589,     // Broadstreet RFC
  RFU_GMS_BASE_URL: "https://gms.rfu.com/fsiservices2/Competitions.svc/json",

  TEAM_ALIASES: {
    "Broadstreet RFC": "Broadstreet",
    "Market Harborough RFC": "Market Harborough",
    "Northampton Old Scouts RFC": "Northampton Old Scouts",
    "Bedford Athletic RFC": "Bedford Athletic",
    "Peterborough RFC": "Peterborough",
    "Stamford RFC": "Stamford",
    "Kettering RFC": "Kettering",
    "Oadby Wyggestonians RFC": "Oadby Wyggestonians",
    "Olney RFC": "Olney",
    "Daventry RFC": "Daventry",
    "Old Coventrians RFC": "Old Coventrians",
    "Wellingborough RFC": "Wellingborough"
  }
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
    if (!tab || ADMIN_CONFIG.ALLOWED_TABS.indexOf(tab) === -1) {
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
      case "syncRfuFixtures":
        return handleSyncRfuFixtures(tab, data);
      case "syncRfuResults":
        return handleSyncRfuResults(tab);
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
  var isAllowed = ADMIN_CONFIG.ALLOWED_EMAILS.some(function(allowedEmail) {
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
      var headerName = String(headers[j]);
      row[headerName] = normalizeReadCellValue_(tabName, headerName, data[i][j]);
    }
    rows.push(row);
  }
  
  return jsonResponse({ success: true, data: rows, headers: headers });
}

function normalizeReadCellValue_(tabName, headerName, value) {
  if (!(value instanceof Date) || isNaN(value.getTime())) {
    return value;
  }

  var key = normalizeReadHeaderKey_(headerName);
  var tz = ADMIN_CONFIG.SYNC_TIME_ZONE || Session.getScriptTimeZone();

  if (tabName === "fixtures") {
    if (key === "time") {
      // Time-only cells are often serialized as 1899-12-30 dates. Return HH:mm.
      return Utilities.formatDate(value, "UTC", "HH:mm");
    }
    if (key === "date") {
      return formatFixtureDate(value, tz);
    }
  }

  if (key.indexOf("time") !== -1) {
    return Utilities.formatDate(value, tz, "HH:mm");
  }
  if (key.indexOf("date") !== -1) {
    return Utilities.formatDate(value, tz, "yyyy-MM-dd");
  }

  return Utilities.formatDate(value, tz, "yyyy-MM-dd'T'HH:mm:ss");
}

function normalizeReadHeaderKey_(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

/**
 * Create a new row
 */
function handleCreate(tabName, data) {
  if (ADMIN_CONFIG.READ_ONLY_TABS.indexOf(tabName) !== -1) {
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
  recalculateStandingsIfFixturesChanged(tabName);
  
  return jsonResponse({ success: true, message: "Row created successfully" });
}

/**
 * Update an existing row
 */
function handleUpdate(tabName, data) {
  if (ADMIN_CONFIG.READ_ONLY_TABS.indexOf(tabName) !== -1) {
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
  recalculateStandingsIfFixturesChanged(tabName);
  
  return jsonResponse({ success: true, message: "Row updated successfully" });
}

/**
 * Delete a row
 */
function handleDelete(tabName, data) {
  if (ADMIN_CONFIG.READ_ONLY_TABS.indexOf(tabName) !== -1) {
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
  recalculateStandingsIfFixturesChanged(tabName);
  
  return jsonResponse({ success: true, message: "Row deleted successfully" });
}

/**
 * Batch update - replace all data in a tab
 */
function handleBatch(tabName, data) {
  if (ADMIN_CONFIG.READ_ONLY_TABS.indexOf(tabName) !== -1) {
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
  recalculateStandingsIfFixturesChanged(tabName);
  
  return jsonResponse({ success: true, message: "Batch update completed" });
}

/**
 * Sync fixtures from RFU ICS feed.
 * Upserts by date + home + away and preserves existing results/bonus values.
 */
function handleSyncRfuFixtures(tabName, data) {
  if (tabName !== "fixtures") {
    return jsonResponse({ success: false, error: "syncRfuFixtures only supports the fixtures tab" }, 400);
  }

  try {
    var overrideUrl = data && data.icsUrl ? String(data.icsUrl).trim() : "";
    var summary = performRfuFixturesSync_(overrideUrl || null);

    return jsonResponse({
      success: true,
      message: "RFU fixtures synced successfully",
      summary: summary
    });
  } catch (err) {
    Logger.log("RFU sync failed: " + err.toString());
    return jsonResponse({ success: false, error: "RFU sync failed: " + err.toString() }, 500);
  }
}

/**
 * Sync only match results/scores from the RFU GMS API.
 */
function handleSyncRfuResults(tabName) {
  if (tabName !== "fixtures") {
    return jsonResponse({ success: false, error: "syncRfuResults only supports the fixtures tab" }, 400);
  }

  try {
    var summary = performRfuResultsSync_();
    return jsonResponse({
      success: true,
      message: "RFU results synced successfully",
      summary: summary
    });
  } catch (err) {
    Logger.log("RFU results sync failed: " + err.toString());
    return jsonResponse({ success: false, error: "RFU results sync failed: " + err.toString() }, 500);
  }
}

/**
 * Shared sync routine used by manual API action and scheduled trigger.
 */
function performRfuFixturesSync_(icsUrl) {
  var sheet = getSheet("fixtures");
  if (!sheet) {
    throw new Error("Tab not found: fixtures");
  }

  var feedSources = resolveRfuFeedSources_(icsUrl);
  if (!feedSources.length) {
    throw new Error("No RFU feed sources configured");
  }

  var allFixtures = [];
  var successfulFeeds = 0;
  var failedFeeds = [];

  for (var i = 0; i < feedSources.length; i++) {
    var source = feedSources[i];
    try {
      var icsContent = fetchIcsContent(source.url);
      var fixtures = parseFixturesFromIcs(icsContent);
      allFixtures = allFixtures.concat(fixtures);
      successfulFeeds++;
    } catch (err) {
      failedFeeds.push({ source: source.name, error: err.toString() });
      Logger.log("RFU feed failed [" + source.name + "]: " + err.toString());
    }
  }

  if (!allFixtures.length) {
    throw new Error("No fixtures could be loaded from any RFU feed source");
  }

  var dedupedFixtures = dedupeFixturesByKey_(allFixtures);
  var summary = syncFixturesToSheet(sheet, dedupedFixtures);
  summary.feed_sources_total = feedSources.length;
  summary.feed_sources_success = successfulFeeds;
  summary.feed_sources_failed = failedFeeds.length;
  summary.fetched_raw = allFixtures.length;
  summary.fetched_deduped = dedupedFixtures.length;
  if (failedFeeds.length) {
    summary.failed_sources = failedFeeds;
  }

  recalculateStandingsIfFixturesChanged("fixtures");

  // Also fetch results from RFU GMS API
  try {
    var resultsSummary = performRfuResultsSync_();
    summary.results_fetched = resultsSummary.fetched;
    summary.results_matched = resultsSummary.matched;
    summary.results_updated = resultsSummary.updated;
    summary.results_created = resultsSummary.created;
    summary.results_skipped = resultsSummary.skipped;
  } catch (resultsErr) {
    summary.results_error = resultsErr.toString();
    Logger.log("RFU results sync failed (non-fatal): " + resultsErr.toString());
  }

  return summary;
}

/**
 * Weekly auto-sync handler. Attach this with setupWeeklyRfuSyncTrigger().
 */
function syncRfuFixturesScheduled() {
  try {
    var summary = performRfuFixturesSync_(null);
    Logger.log("Scheduled RFU sync complete: " + JSON.stringify(summary));
  } catch (err) {
    Logger.log("Scheduled RFU sync failed: " + err.toString());
  }
}

/**
 * Fetch match results from the RFU Game Management System (GMS) API
 * and update scores for matching fixtures in the sheet.
 */
function performRfuResultsSync_() {
  var teamId = ADMIN_CONFIG.RFU_GMS_TEAM_ID;
  var clubId = ADMIN_CONFIG.RFU_GMS_CLUB_ID;
  var baseUrl = ADMIN_CONFIG.RFU_GMS_BASE_URL;

  if (!teamId || !clubId || !baseUrl) {
    throw new Error("RFU GMS config missing (RFU_GMS_TEAM_ID, RFU_GMS_CLUB_ID, RFU_GMS_BASE_URL)");
  }

  var url = baseUrl + "/GetResultsSimplified?teamId=" + teamId + "&clubId=" + clubId;
  var response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { Accept: "application/json" }
  });

  var code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error("RFU GMS API returned HTTP " + code);
  }

  var results;
  try {
    results = JSON.parse(response.getContentText());
  } catch (e) {
    throw new Error("Failed to parse RFU GMS response: " + e.toString());
  }

  if (!results || !results.length) {
    return { fetched: 0, matched: 0, updated: 0, skipped: 0 };
  }

  var sheet = getSheet("fixtures");
  if (!sheet) {
    throw new Error("Tab not found: fixtures");
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var fields = getFixtureFieldKeys(headers);
  var rows = readSheetRowsAsObjects(sheet, headers);
  var teamMap = buildNormalizedTeamMap(rows, fields);

  var existingByKey = {};
  for (var i = 0; i < rows.length; i++) {
    var key = buildFixtureKey(rows[i][fields.date], rows[i][fields.home_team], rows[i][fields.away_team]);
    if (key && !existingByKey[key]) {
      existingByKey[key] = rows[i];
    }
  }

  var tz = ADMIN_CONFIG.SYNC_TIME_ZONE || Session.getScriptTimeZone();
  var matched = 0;
  var updated = 0;
  var created = 0;
  var skipped = 0;

  for (var j = 0; j < results.length; j++) {
    var result = results[j];
    if (!result) continue;

    var resultType = String(result.Type || "").toUpperCase();
    if (resultType !== "RESULT" && resultType !== "HOMEWALKOVER" && resultType !== "AWAYWALKOVER") {
      skipped++;
      continue;
    }

    var dateObj = parseGmsDate_(result.Date);
    if (!dateObj) { skipped++; continue; }

    var homeTeam = canonicalizeTeamName(String(result.HomeTeamName || ""), teamMap);
    var awayTeam = canonicalizeTeamName(String(result.AwayTeamName || ""), teamMap);
    if (!homeTeam || !awayTeam) { skipped++; continue; }

    var dateStr = formatFixtureDate(dateObj, tz);
    var key = buildFixtureKey(dateStr, homeTeam, awayTeam);
    var target = key ? existingByKey[key] : null;

    var homeScore = parseInt(result.HomeFullTimeScore, 10);
    var awayScore = parseInt(result.AwayFullTimeScore, 10);
    if (isNaN(homeScore)) homeScore = 0;
    if (isNaN(awayScore)) awayScore = 0;

    if (target) {
      // Existing fixture found — update scores if changed
      matched++;

      var existingHome = String(target[fields.home_score] || "").trim();
      var existingAway = String(target[fields.away_score] || "").trim();

      if (existingHome !== "" && existingAway !== "" &&
          existingHome === String(homeScore) && existingAway === String(awayScore)) {
        continue;
      }

      target[fields.home_score] = homeScore;
      target[fields.away_score] = awayScore;
      target[fields.status] = "completed";
      updated++;
    } else {
      // No matching fixture — create a new row from the GMS result
      var newRow = newEmptyRowObject(headers);
      newRow[fields.date] = dateStr;
      newRow[fields.home_team] = homeTeam;
      newRow[fields.away_team] = awayTeam;
      newRow[fields.home_score] = homeScore;
      newRow[fields.away_score] = awayScore;
      newRow[fields.status] = "completed";

      var competition = String(result.CompetitionName || result.Competition || "").trim();
      if (competition && fields.competition) {
        newRow[fields.competition] = competition;
      }

      rows.push(newRow);
      existingByKey[key] = newRow;
      created++;
    }
  }

  if (updated > 0 || created > 0) {
    writeRowsToSheet(sheet, headers, rows);
    recalculateStandingsIfFixturesChanged("fixtures");
  }

  return {
    fetched: results.length,
    matched: matched,
    updated: updated,
    created: created,
    skipped: skipped
  };
}

/**
 * Parse .NET JSON date format: /Date(milliseconds+offset)/
 */
function parseGmsDate_(dateValue) {
  if (!dateValue) return null;
  var text = String(dateValue);
  var m = text.match(/\/Date\((\d+)([+-]\d{4})?\)\//);
  if (!m) return null;
  return new Date(parseInt(m[1], 10));
}

function resolveRfuFeedSources_(icsUrl) {
  var overrideUrl = icsUrl ? String(icsUrl).trim() : "";
  if (overrideUrl) {
    return [{ name: "Manual Override", url: overrideUrl }];
  }

  var feeds = ADMIN_CONFIG.RFU_TEAM_FEEDS;
  var out = [];

  if (feeds && Object.prototype.toString.call(feeds) === "[object Array]") {
    for (var i = 0; i < feeds.length; i++) {
      var item = feeds[i] || {};
      var url = String(item.icsUrl || item.url || "").trim();
      if (!url) continue;
      var name = String(item.team || item.name || ("Feed " + (i + 1))).trim();
      out.push({ name: name, url: url });
    }
  }

  if (!out.length) {
    var fallbackUrl = String(ADMIN_CONFIG.RFU_ICS_URL || "").trim();
    if (fallbackUrl) {
      out.push({ name: "RFU_ICS_URL", url: fallbackUrl });
    }
  }

  return out;
}

function dedupeFixturesByKey_(fixtures) {
  var seen = {};
  var out = [];

  for (var i = 0; i < fixtures.length; i++) {
    var f = fixtures[i];
    if (!f) continue;

    var key = buildFixtureKey(f.date, f.home_team, f.away_team);
    if (!key) continue;

    if (!seen[key]) {
      seen[key] = f;
      out.push(f);
      continue;
    }

    var existing = seen[key];
    if (!existing.time && f.time) existing.time = f.time;
    if (!existing.venue && f.venue) existing.venue = f.venue;
    if (!existing.competition && f.competition) existing.competition = f.competition;
  }

  return out;
}

/**
 * Run once from Apps Script editor to create a single weekly trigger.
 * Uses ADMIN_CONFIG.AUTO_SYNC_WEEKDAY and ADMIN_CONFIG.AUTO_SYNC_HOUR.
 */
function setupWeeklyRfuSyncTrigger() {
  deleteTriggersByHandler_("syncRfuFixturesScheduled");

  var hour = normalizeTriggerHour_(ADMIN_CONFIG.AUTO_SYNC_HOUR);
  var weekday = getWeekDayEnum_(ADMIN_CONFIG.AUTO_SYNC_WEEKDAY);

  ScriptApp.newTrigger("syncRfuFixturesScheduled")
    .timeBased()
    .onWeekDay(weekday)
    .atHour(hour)
    .create();

  Logger.log("Weekly RFU sync trigger created: " + String(ADMIN_CONFIG.AUTO_SYNC_WEEKDAY) + " at " + hour + ":00");
}

/**
 * Remove all weekly RFU auto-sync triggers.
 */
function removeWeeklyRfuSyncTrigger() {
  deleteTriggersByHandler_("syncRfuFixturesScheduled");
  Logger.log("Weekly RFU sync trigger(s) removed.");
}

function deleteTriggersByHandler_(handlerName) {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === handlerName) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function normalizeTriggerHour_(value) {
  var n = parseInt(value, 10);
  if (isNaN(n)) return 6;
  if (n < 0) return 0;
  if (n > 23) return 23;
  return n;
}

function getWeekDayEnum_(weekdayText) {
  var key = String(weekdayText || "MONDAY").toUpperCase().trim();
  var map = {
    SUNDAY: ScriptApp.WeekDay.SUNDAY,
    MONDAY: ScriptApp.WeekDay.MONDAY,
    TUESDAY: ScriptApp.WeekDay.TUESDAY,
    WEDNESDAY: ScriptApp.WeekDay.WEDNESDAY,
    THURSDAY: ScriptApp.WeekDay.THURSDAY,
    FRIDAY: ScriptApp.WeekDay.FRIDAY,
    SATURDAY: ScriptApp.WeekDay.SATURDAY
  };
  return map[key] || ScriptApp.WeekDay.MONDAY;
}

function fetchIcsContent(url) {
  var normalizedUrl = normalizeIcsUrl(url);
  var response = UrlFetchApp.fetch(normalizedUrl, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { Accept: "text/calendar,text/plain,*/*" }
  });

  var code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error("Unable to fetch ICS feed. HTTP " + code);
  }

  return response.getContentText();
}

function normalizeIcsUrl(url) {
  var raw = String(url || "").trim();
  if (raw.toLowerCase().indexOf("webcal://") === 0) {
    return "https://" + raw.substring(9);
  }
  return raw;
}

function parseFixturesFromIcs(icsContent) {
  var text = unfoldIcsText(icsContent);
  var blocks = text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  var fixtures = [];
  var seen = {};

  for (var i = 0; i < blocks.length; i++) {
    var fixture = parseIcsEventFixture(blocks[i]);
    if (!fixture) continue;

    var dedupeKey = buildFixtureKey(fixture.date, fixture.home_team, fixture.away_team);
    if (!dedupeKey || seen[dedupeKey]) continue;

    seen[dedupeKey] = true;
    fixtures.push(fixture);
  }

  return fixtures;
}

function unfoldIcsText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, "");
}

function parseIcsEventFixture(eventBlock) {
  var props = parseIcsProperties(eventBlock);
  var summary = unescapeIcsText(getIcsPropertyValue(props, "SUMMARY"));
  var teams = parseTeamsFromSummary(summary);
  if (!teams) return null;

  var start = parseIcsStartDateTime(props);
  if (!start) return null;

  var description = unescapeIcsText(getIcsPropertyValue(props, "DESCRIPTION"));
  var competition = extractCompetitionFromDescription(description);
  var venue = unescapeIcsText(getIcsPropertyValue(props, "LOCATION"));

  return {
    date: start.date,
    time: start.time,
    home_team: teams.home_team,
    away_team: teams.away_team,
    venue: venue || "",
    competition: competition || "",
    status: isFixtureDatePast_(start.date) ? "completed" : "upcoming",
    home_score: "",
    away_score: "",
    home_bp: "",
    away_bp: ""
  };
}

function parseIcsProperties(eventBlock) {
  var props = {};
  var lines = String(eventBlock || "").split("\n");

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line) continue;
    if (line === "BEGIN:VEVENT" || line === "END:VEVENT") continue;

    var sep = line.indexOf(":");
    if (sep < 0) continue;

    var keyPart = line.substring(0, sep).trim();
    var value = line.substring(sep + 1);
    var baseKey = keyPart.split(";")[0].toUpperCase();
    if (!baseKey) continue;

    if (!props[baseKey]) {
      props[baseKey] = {
        key: keyPart.toUpperCase(),
        value: value
      };
    }
  }

  return props;
}

function getIcsPropertyValue(props, key) {
  return props[key] ? props[key].value : "";
}

function unescapeIcsText(value) {
  return String(value || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseTeamsFromSummary(summary) {
  var clean = String(summary || "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return null;

  var parts = clean.split(/\s+vs\s+/i);
  if (parts.length !== 2) {
    parts = clean.split(/\s+v\s+/i);
  }
  if (parts.length !== 2) return null;

  var homeTeam = parts[0].replace(/^[-:]+|[-:]+$/g, "").trim();
  var awayTeam = parts[1].replace(/^[-:]+|[-:]+$/g, "").trim();
  if (!homeTeam || !awayTeam) return null;

  return {
    home_team: homeTeam,
    away_team: awayTeam
  };
}

function parseIcsStartDateTime(props) {
  var entry = props.DTSTART;
  if (!entry || !entry.value) return null;

  var key = String(entry.key || "");
  var value = String(entry.value || "").trim();
  var tz = ADMIN_CONFIG.SYNC_TIME_ZONE || Session.getScriptTimeZone();
  var dateObj;
  var timeText;

  if (key.indexOf("VALUE=DATE") !== -1 || /^\d{8}$/.test(value)) {
    dateObj = parseIcsDateValue(value);
    if (!dateObj) return null;
    timeText = ADMIN_CONFIG.DEFAULT_FIXTURE_TIME || "3:00 PM";
  } else {
    dateObj = parseIcsTimestampValue(value);
    if (!dateObj) return null;
    timeText = formatFixtureTime(dateObj, tz);
  }

  return {
    date: formatFixtureDate(dateObj, tz),
    time: timeText
  };
}

function parseIcsDateValue(value) {
  var m = String(value || "").match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;

  return new Date(Date.UTC(
    parseInt(m[1], 10),
    parseInt(m[2], 10) - 1,
    parseInt(m[3], 10),
    12, 0, 0
  ));
}

function parseIcsTimestampValue(value) {
  var s = String(value || "").trim();
  var m;

  m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (m) {
    return new Date(Date.UTC(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      parseInt(m[4], 10),
      parseInt(m[5], 10),
      parseInt(m[6], 10)
    ));
  }

  m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (m) {
    return new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      parseInt(m[4], 10),
      parseInt(m[5], 10),
      parseInt(m[6], 10)
    );
  }

  m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})Z$/);
  if (m) {
    return new Date(Date.UTC(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      parseInt(m[4], 10),
      parseInt(m[5], 10),
      0
    ));
  }

  m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})$/);
  if (m) {
    return new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      parseInt(m[4], 10),
      parseInt(m[5], 10),
      0
    );
  }

  var fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function formatFixtureDate(dateObj, tz) {
  var iso = Utilities.formatDate(dateObj, tz, "yyyy-MM-dd");
  var parts = iso.split("-");
  if (parts.length !== 3) return iso;

  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  var d = parseInt(parts[2], 10);
  var calendarDate = new Date(Date.UTC(y, m - 1, d));

  var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return dayNames[calendarDate.getUTCDay()] + " " + d + " " + monthNames[m - 1] + " " + y;
}

function formatFixtureTime(dateObj, tz) {
  return Utilities.formatDate(dateObj, tz, "h:mm a");
}

function extractCompetitionFromDescription(description) {
  var firstLine = String(description || "").split("\n")[0].trim();
  if (!firstLine) return "";
  return firstLine.split("|")[0].trim();
}

function syncFixturesToSheet(sheet, incomingFixtures) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    throw new Error("fixtures sheet has no headers in row 1");
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (!headers || headers.length === 0) {
    throw new Error("fixtures sheet has no headers in row 1");
  }

  var fields = getFixtureFieldKeys(headers);
  var rows = readSheetRowsAsObjects(sheet, headers);
  var dedupeInfo = dedupeExistingFixtureRows_(rows, fields);
  rows = dedupeInfo.rows;
  var teamMap = buildNormalizedTeamMap(rows, fields);
  var existingByKey = {};

  for (var i = 0; i < rows.length; i++) {
    var existingKey = buildFixtureKey(rows[i][fields.date], rows[i][fields.home_team], rows[i][fields.away_team]);
    if (existingKey && !existingByKey[existingKey]) {
      existingByKey[existingKey] = rows[i];
    }
  }

  var added = 0;
  var updated = 0;
  var skipped = 0;

  for (var j = 0; j < incomingFixtures.length; j++) {
    var fixture = incomingFixtures[j];
    var homeTeam = canonicalizeTeamName(fixture.home_team, teamMap);
    var awayTeam = canonicalizeTeamName(fixture.away_team, teamMap);
    var key = buildFixtureKey(fixture.date, homeTeam, awayTeam);

    if (!key) {
      skipped++;
      continue;
    }

    var target = existingByKey[key];
    if (!target) {
      target = newEmptyRowObject(headers);
      rows.push(target);
      existingByKey[key] = target;
      added++;
    } else {
      updated++;
    }

    target[fields.date] = fixture.date;
    target[fields.time] = fixture.time || target[fields.time] || ADMIN_CONFIG.DEFAULT_FIXTURE_TIME || "3:00 PM";
    target[fields.home_team] = homeTeam;
    target[fields.away_team] = awayTeam;
    target[fields.venue] = fixture.venue || target[fields.venue] || "";
    target[fields.competition] = fixture.competition || target[fields.competition] || "";

    var preserveResult = hasCompletedResult(target, fields);
    if (!preserveResult) {
      target[fields.status] = isFixtureDatePast_(target[fields.date]) ? "completed" : "upcoming";
      target[fields.home_score] = "";
      target[fields.away_score] = "";
      target[fields.home_bp] = "";
      target[fields.away_bp] = "";
    } else if (isBlank(target[fields.status])) {
      target[fields.status] = "completed";
    }
  }

  rows.sort(function(a, b) {
    return compareFixtureRows(a, b, fields);
  });

  writeRowsToSheet(sheet, headers, rows);

  return {
    fetched: incomingFixtures.length,
    added: added,
    updated: updated,
    skipped: skipped,
    removed_duplicates: dedupeInfo.removed,
    total_rows: rows.length
  };
}

function dedupeExistingFixtureRows_(rows, fields) {
  var keyed = {};
  var out = [];
  var removed = 0;

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var key = buildFixtureKey(row[fields.date], row[fields.home_team], row[fields.away_team]);

    if (!key) {
      out.push(row);
      continue;
    }

    var existing = keyed[key];
    if (!existing) {
      keyed[key] = row;
      out.push(row);
      continue;
    }

    mergeFixtureRows_(existing, row, fields);
    removed++;
  }

  return {
    rows: out,
    removed: removed
  };
}

function mergeFixtureRows_(target, source, fields) {
  if (isBlank(target[fields.time]) && !isBlank(source[fields.time])) {
    target[fields.time] = source[fields.time];
  }
  if (isBlank(target[fields.venue]) && !isBlank(source[fields.venue])) {
    target[fields.venue] = source[fields.venue];
  }
  if (isBlank(target[fields.competition]) && !isBlank(source[fields.competition])) {
    target[fields.competition] = source[fields.competition];
  }

  var targetCompleted = hasCompletedResult(target, fields);
  var sourceCompleted = hasCompletedResult(source, fields);
  if (!targetCompleted && sourceCompleted) {
    target[fields.status] = source[fields.status] || "completed";
    target[fields.home_score] = source[fields.home_score];
    target[fields.away_score] = source[fields.away_score];
    target[fields.home_bp] = source[fields.home_bp];
    target[fields.away_bp] = source[fields.away_bp];
  } else if (isBlank(target[fields.status]) && !isBlank(source[fields.status])) {
    target[fields.status] = source[fields.status];
  }
}

function getFixtureFieldKeys(headers) {
  var required = ["date", "time", "home_team", "away_team", "venue", "competition", "home_score", "away_score", "status", "home_bp", "away_bp"];
  var fields = {};

  for (var i = 0; i < required.length; i++) {
    var fieldName = required[i];
    var headerName = findHeaderName(headers, fieldName);
    if (!headerName) {
      throw new Error("fixtures tab is missing required header: " + fieldName);
    }
    fields[fieldName] = headerName;
  }

  return fields;
}

function findHeaderName(headers, normalizedFieldName) {
  for (var i = 0; i < headers.length; i++) {
    var raw = String(headers[i]);
    if (normalizeHeaderName(raw) === normalizedFieldName) {
      return raw;
    }
  }
  return null;
}

function normalizeHeaderName(name) {
  return String(name || "").toLowerCase().trim().replace(/\s+/g, "_");
}

function readSheetRowsAsObjects(sheet, headers) {
  var rows = [];
  var lastRow = sheet.getLastRow();
  var lastCol = headers.length;

  if (lastRow < 2) return rows;

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  for (var r = 0; r < values.length; r++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[String(headers[c])] = values[r][c];
    }
    rows.push(obj);
  }

  return rows;
}

function writeRowsToSheet(sheet, headers, rows) {
  var existingRows = sheet.getLastRow();
  if (existingRows > 1) {
    sheet.deleteRows(2, existingRows - 1);
  }

  if (!rows.length) return;

  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var rowObj = rows[i];
    var line = [];
    for (var c = 0; c < headers.length; c++) {
      var key = String(headers[c]);
      line.push(rowObj[key] !== undefined ? rowObj[key] : "");
    }
    out.push(line);
  }

  sheet.getRange(2, 1, out.length, headers.length).setValues(out);
}

function newEmptyRowObject(headers) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[String(headers[i])] = "";
  }
  return obj;
}

function buildNormalizedTeamMap(rows, fields) {
  var map = {};
  for (var i = 0; i < rows.length; i++) {
    addTeamToMap(map, rows[i][fields.home_team]);
    addTeamToMap(map, rows[i][fields.away_team]);
  }
  return map;
}

function addTeamToMap(map, name) {
  var clean = String(name || "").replace(/\s+/g, " ").trim();
  if (!clean) return;

  var key = normalizeTeamKey(clean);
  if (!key || map[key]) return;
  map[key] = clean;
}

function canonicalizeTeamName(name, teamMap) {
  var withAlias = applyTeamAlias(name);
  var clean = String(withAlias || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  var key = normalizeTeamKey(clean);
  if (key && teamMap[key]) return teamMap[key];
  if (key) teamMap[key] = clean;

  return clean;
}

function applyTeamAlias(name) {
  var clean = String(name || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  var aliases = ADMIN_CONFIG.TEAM_ALIASES || {};
  var normalized = normalizeTeamKey(clean);

  for (var key in aliases) {
    if (!aliases.hasOwnProperty(key)) continue;
    if (normalizeTeamKey(key) === normalized) {
      return String(aliases[key] || "").replace(/\s+/g, " ").trim();
    }
  }

  return clean.replace(/\s+rfc$/i, "").trim();
}

function normalizeTeamKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\brfc\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFixtureKey(dateValue, homeTeam, awayTeam) {
  var dateKey = normalizeDateKey(dateValue);
  var homeKey = normalizeTeamKey(homeTeam);
  var awayKey = normalizeTeamKey(awayTeam);
  if (!dateKey || !homeKey || !awayKey) return "";
  return dateKey + "|" + homeKey + "|" + awayKey;
}

function normalizeDateKey(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, "UTC", "yyyy-MM-dd");
  }

  var text = String(value || "").trim();
  if (!text) return "";

  var m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return m[1] + "-" + m[2] + "-" + m[3];

  m = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return m[1] + "-" + m[2] + "-" + m[3];

  var parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, "UTC", "yyyy-MM-dd");
  }

  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function hasCompletedResult(rowObj, fields) {
  var status = String(rowObj[fields.status] || "").toLowerCase().trim();
  if (status === "completed") return true;

  var homeScore = String(rowObj[fields.home_score] || "").trim();
  var awayScore = String(rowObj[fields.away_score] || "").trim();
  if (homeScore === "" || awayScore === "") return false;

  return !isNaN(parseInt(homeScore, 10)) && !isNaN(parseInt(awayScore, 10));
}

function compareFixtureRows(a, b, fields) {
  var dateA = normalizeDateKey(a[fields.date]);
  var dateB = normalizeDateKey(b[fields.date]);
  if (dateA < dateB) return -1;
  if (dateA > dateB) return 1;

  var timeA = normalizeTimeKey(a[fields.time]);
  var timeB = normalizeTimeKey(b[fields.time]);
  if (timeA < timeB) return -1;
  if (timeA > timeB) return 1;

  var homeA = String(a[fields.home_team] || "").toLowerCase();
  var homeB = String(b[fields.home_team] || "").toLowerCase();
  if (homeA < homeB) return -1;
  if (homeA > homeB) return 1;

  var awayA = String(a[fields.away_team] || "").toLowerCase();
  var awayB = String(b[fields.away_team] || "").toLowerCase();
  if (awayA < awayB) return -1;
  if (awayA > awayB) return 1;

  return 0;
}

function normalizeTimeKey(value) {
  var s = String(value || "").trim().toUpperCase();
  if (!s) return "99:99";

  var m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (m) {
    var hour = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    var ap = m[3];

    if (ap === "PM" && hour < 12) hour += 12;
    if (ap === "AM" && hour === 12) hour = 0;

    var hh = hour < 10 ? "0" + hour : String(hour);
    var mm = min < 10 ? "0" + min : String(min);
    return hh + ":" + mm;
  }

  m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    var h = parseInt(m[1], 10);
    var mi = parseInt(m[2], 10);
    var h2 = h < 10 ? "0" + h : String(h);
    var m2 = mi < 10 ? "0" + mi : String(mi);
    return h2 + ":" + m2;
  }

  return s;
}

function isFixtureDatePast_(dateValue) {
  var tz = ADMIN_CONFIG.SYNC_TIME_ZONE || Session.getScriptTimeZone();
  var today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");

  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return Utilities.formatDate(dateValue, tz, "yyyy-MM-dd") < today;
  }

  var text = String(dateValue || "").trim();
  if (!text) return false;

  var m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return text < today;

  m = text.match(/^(?:[A-Za-z]+,?\s+)?(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})$/);
  if (m) {
    var months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
    var monthIdx = months[m[2].toLowerCase().substring(0, 3)];
    if (monthIdx === undefined) return false;
    var d = new Date(parseInt(m[3], 10), monthIdx, parseInt(m[1], 10));
    return Utilities.formatDate(d, tz, "yyyy-MM-dd") < today;
  }

  var parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, tz, "yyyy-MM-dd") < today;
  }

  return false;
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

/**
 * Recalculate standings automatically after fixtures changes.
 * The calculateStandings function is defined in google-apps-script.js.
 */
function recalculateStandingsIfFixturesChanged(tabName) {
  if (tabName !== "fixtures") return;
  if (typeof calculateStandings !== "function") {
    Logger.log("calculateStandings() not found; skipped auto-standings recalculation.");
    return;
  }

  try {
    calculateStandings();
  } catch (err) {
    Logger.log("Auto standings recalculation failed: " + err.toString());
  }
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
  return ADMIN_CONFIG.ALLOWED_EMAILS;
}

/**
 * Add an email to the authorized list (run manually)
 * Usage: Run this function from Apps Script editor
 */
function addAuthorizedEmail() {
  var email = "new.email@example.com"; // Change this
  ADMIN_CONFIG.ALLOWED_EMAILS.push(email);
  Logger.log("Added: " + email);
  Logger.log("Current list: " + ADMIN_CONFIG.ALLOWED_EMAILS.join(", "));
}

/**
 * Test token verification (for debugging)
 */
function testTokenVerification() {
  var testToken = "YOUR_TEST_TOKEN_HERE";
  var result = verifyGoogleToken(testToken);
  Logger.log(JSON.stringify(result));
}
