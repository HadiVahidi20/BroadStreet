# 🎯 Broadstreet RFC Admin Panel - Complete Guide

## 🔐 Secure Authentication with Google Sign-In

This admin panel uses **Google Sign-In** for authentication. This means:
- ✅ No passwords needed
- ✅ High security with Google OAuth 2.0
- ✅ Only authorized emails can access
- ✅ Two-factor authentication (if enabled in Gmail)

---

## 📋 Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Google OAuth Setup](#google-oauth-setup)
3. [Google Apps Script Configuration](#google-apps-script-configuration)
4. [Using the Admin Panel](#using-the-admin-panel)
5. [Manageable Sections](#manageable-sections)
6. [Security](#security)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Installation & Setup

### Step 1: Files Overview

All necessary files have been created in your project:

```
broadstreet-rfc-website/
├── pages/
│   └── admin.html                          # Main admin panel page
├── css/
│   └── admin.css                           # Admin panel styling
├── js/
│   └── admin.js                            # Admin panel logic & Google Sign-In
└── sheets-template/
    └── google-apps-script-admin-api.js     # Google Apps Script with auth
```

### Step 2: Upload Files

Upload all files to your server or deploy via Netlify.

---

## 🔑 Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a project**
3. Click **NEW PROJECT**
4. Enter project name (e.g., `Broadstreet RFC Admin`)
5. Click **CREATE**

### Step 2: Configure OAuth Consent Screen

1. In left menu: **APIs & Services → OAuth consent screen**
2. User type: Select **External**
3. Click **CREATE**
4. Fill in app information:
   - App name: `Broadstreet RFC Admin`
   - User support email: Your email
   - Developer contact: Your email
5. Click **SAVE AND CONTINUE**
6. In Scopes: Click **SAVE AND CONTINUE**
7. In Test users: Add authorized emails
8. Click **SAVE AND CONTINUE**

### Step 3: Create OAuth Client ID

1. In left menu: **APIs & Services → Credentials**
2. Click **CREATE CREDENTIALS → OAuth client ID**
3. Application type: **Web application**
4. Name: `Broadstreet Admin Panel`
5. Add **Authorized JavaScript origins**:
   ```
   https://your-domain.com
   http://localhost:3000
   ```
6. Add **Authorized redirect URIs**:
   ```
   https://your-domain.com/pages/admin.html
   ```
7. Click **CREATE**
8. **Copy the Client ID**

### Step 4: Add Client ID and Apps Script URL to Code

Open `js/admin.js` and find these lines:

```javascript
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL';
```

Replace them with your actual values:

```javascript
const GOOGLE_CLIENT_ID = '123456789-abc123xyz.apps.googleusercontent.com';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
```

⚠️ **Important:** You need to get the Apps Script URL from Step 4 of the next section first!

---

## ⚙️ Google Apps Script Configuration

### Step 1: Open Your Google Sheet

1. Go to your Google Sheet containing your website data
2. Ensure your sheet has these tabs:
   - `news`
   - `fixtures`
   - `sponsors`
   - `players`
   - `hero`
   - `standings`

### Step 2: Create the Apps Script

1. In Google Sheet, go to **Extensions → Apps Script**
2. Create a new file named `AdminAPI`
3. Copy the contents of `google-apps-script-admin-api.js`
4. Paste it into the Apps Script editor

### Step 3: Set Allowed Emails

In the Apps Script code, find the `ALLOWED_EMAILS` section:

```javascript
var CONFIG = {
  ALLOWED_EMAILS: [
    // "admin@broadstreetrfc.co.uk",
    // "your.email@gmail.com",
  ],
  // ...
};
```

Add emails of people who should have admin access:

```javascript
ALLOWED_EMAILS: [
  "admin@broadstreetrfc.co.uk",
  "john.smith@gmail.com",
  "manager@broadstreetrfc.co.uk",
],
```

⚠️ **Important:** Only emails in this list can access the admin panel!

### Step 4: Deploy as Web App

1. Click the **Deploy** button
2. Select **New deployment**
3. Choose type: **Web app**
4. Configure settings:
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone (or Anyone with the link)
5. Click **Deploy**
6. Authorize the required permissions
7. **Copy the URL** provided

The URL will look like:
```
https://script.google.com/macros/s/AKfycby.../exec
```

### Step 5: Add the URL to Code

Now go back to `js/admin.js` and update the `APPS_SCRIPT_URL`:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
```

Replace with the actual URL you copied from deployment.

---

## 🔐 Using the Admin Panel

### Login

1. Navigate to `/pages/admin.html`
2. Click the **Sign in with Google** button
3. Select your Google account
4. If your email is authorized, you'll enter the dashboard

### Admin Interface

After login, you'll see a complete dashboard with:

#### Sidebar Navigation
- **News:** Manage news articles
- **Fixtures:** Manage fixtures and results
- **Sponsors:** Manage sponsors
- **Players:** Manage player profiles
- **Hero Carousel:** Manage homepage slides
- **Standings:** View league table (read-only)

#### Main Operations

**Adding Items:**
1. Click the **Add** button at the top of any section
2. Fill in the form
3. Click **Save**
4. Data is saved directly to Google Sheets

**Editing Items:**
1. Click the **pencil icon** next to any item
2. Make your changes
3. Click **Save**

**Deleting Items:**
1. Click the **trash icon**
2. Confirm deletion

---

## 📦 Manageable Sections

### 📰 News

Fields:
- **Title:** Article headline
- **Date:** Publication date (e.g., `1 Feb 2026`)
- **Category:** Category (e.g., `Match Report`, `Club News`)
- **Excerpt:** Brief description
- **Image URL:** Featured image URL
- **Link URL:** Link to full article
- **Featured:** Set to `true` to feature on homepage

### 📅 Fixtures

Fields:
- **Date:** Match date
- **Time:** Kick-off time
- **Home Team:** Home team name
- **Away Team:** Away team name
- **Venue:** Match venue
- **Competition:** Competition name
- **Home Score / Away Score:** Match result
- **Status:** Match status (`upcoming`, `completed`, `postponed`)
- **Home BP / Away BP:** Bonus points

⚡ **Note:** After editing fixtures, the standings table is automatically recalculated.

### 💰 Sponsors

Fields:
- **Name:** Sponsor name
- **Tier:** Sponsorship level (`title`, `premium`, `partner`)
- **Logo Path:** Path to logo file
- **Website Link:** Sponsor website URL
- **Tagline:** Optional tagline

### 👥 Players

Fields:
- **Name:** Player name
- **Position:** Playing position
- **Jersey Number:** Squad number
- **Image URL:** Player photo
- **Height / Weight:** Physical stats
- **Age:** Player age
- **Caps:** Number of appearances
- **Team:** Team name (e.g., `1st XV`)

### 🎭 Hero Carousel

Fields:
- **Title:** Main heading (use `|` to split lines)
- **Subtitle:** Subheading text
- **Background Image:** Background image path
- **CTA Button Text / Link:** Primary button
- **Secondary CTA Text / Link:** Secondary button

### 📊 Standings

This section is **read-only** and automatically calculated from fixtures data.

---

## 🔒 Security

### Google Sign-In Security

Google Sign-In authentication provides high security:

✅ **Benefits:**
- No passwords = no risk of password leaks
- Google's two-factor authentication
- Cryptographically signed tokens
- Google's security policies

### Add/Remove Admins

To change who has access:

1. Go to Google Apps Script
2. Find the `ALLOWED_EMAILS` section
3. Add or remove emails
4. Redeploy the script

```javascript
ALLOWED_EMAILS: [
  "admin@broadstreetrfc.co.uk",
  "new.admin@gmail.com",  // Adding new admin
],
```

### Protect the URLs

- Keep the admin panel URL private
- Consider adding `.htaccess` or server-side authentication
- Protect the Web App URL

### Backups

Google Sheets automatically maintains version history:
- **File → Version history → See version history**

---

## 🐛 Troubleshooting

### Issue 1: "Please configure APPS_SCRIPT_URL" or "Unauthorized"

**Solution:**
- Ensure you've set the `APPS_SCRIPT_URL` in `js/admin.js`
- Ensure your email is in the `ALLOWED_EMAILS` list
- Check the Apps Script URL is correct
- Ensure Apps Script is properly deployed

### Issue 2: "Sign-in popup blocked"

**Solution:**
- Allow the browser to open popups
- Refresh the page and try again
- Try a different browser

### Issue 3: "Failed to load data"

**Solution:**
- Verify Google Sheet tab names are correct
- Ensure first row contains headers
- Redeploy the Apps Script

### Issue 4: CORS or Network Error

**Solution:**
- Ensure "Who has access" is set to "Anyone" in Apps Script
- Clear browser cache
- Try a different browser

### Issue 5: Changes not saving

**Solution:**
- Check Apps Script has necessary permissions
- Review Apps Script logs: **Executions**
- Verify Sheet is not locked

### Issue 6: Standings not updating

**Solution:**
- The standings are updated by the original `google-apps-script.js` file
- Ensure that script is also in your Apps Script project
- Set up a trigger to run it automatically

---

## 📝 Important Notes

1. **Always backup** before making major changes
2. Keep the **email list** up to date
3. Keep the **admin URL private**
4. Store **images** in the `assets/` folder
5. Maintain **consistent date formats**

---

## 🎉 You're All Set!

You can now manage all website content easily through the admin panel.

With Google Sign-In, your account security is guaranteed.

If you have questions or need help, refer to the code files or contact your developer.

---

## 📞 Support

For technical issues:
1. Check browser Console for errors (F12)
2. Review Apps Script execution logs
3. Use backup version if needed

---

## 🌐 Accessing the Admin Panel

**URL:** `https://your-domain.com/pages/admin.html`

**Authentication:** Google Sign-In (only authorized emails)

**Requirements:**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Google account with email in ALLOWED_EMAILS list
- Deployed Google Apps Script

---

**Version:** 2.0 (Google Sign-In)  
**Date:** February 2026  
**Compatible with:** Google Sheets API v4, Google Identity Services
