# Google Sheets Setup Guide

This folder contains CSV templates and Google Apps Scripts for the Broadstreet RFC website.

## Files Overview

### CSV Templates
- `news.csv` - News articles
- `fixtures.csv` - Match fixtures and results
- `standings.csv` - League table (auto-calculated)
- `players.csv` - Player profiles
- `coaching.csv` - Coaching staff
- `sponsors.csv` - Sponsor information
- `hero.csv` - Homepage hero carousel

### Google Apps Scripts
- `google-apps-script.js` - Auto-calculate standings from fixtures (original)
- `google-apps-script-admin-api.js` - **NEW!** Admin Panel API for CRUD operations

---

## Step 1: Create Google Sheet
1. Go to https://sheets.google.com
2. Click **Blank spreadsheet**
3. Name it: `Broadstreet RFC Website`

## Step 2: Import each CSV as a Tab
For each CSV file in this folder:
1. Go to **File → Import**
2. Click **Upload** tab → select the CSV file
3. Import location: **Insert new sheet(s)**
4. Click **Import data**
5. **Rename the tab** (bottom of sheet) to match the filename:
   - `news`, `fixtures`, `standings`, `players`, `coaching`, `sponsors`, `hero`

### Tab order should be:
| Tab name | CSV file |
|----------|----------|
| `news` | news.csv |
| `fixtures` | fixtures.csv |
| `standings` | standings.csv |
| `players` | players.csv |
| `coaching` | coaching.csv |
| `sponsors` | sponsors.csv |
| `hero` | hero.csv |

## Step 3: Share the Sheet
1. Click **Share** button (top right)
2. Under "General access", change to **Anyone with the link**
3. Set role to **Viewer**
4. Click **Done**

## Step 4: Get Google Sheets API Key
1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Go to **APIs & Services → Library**
4. Search for **Google Sheets API** → click **Enable**
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
7. Copy the API key

### Restrict the API Key (IMPORTANT):
1. Click on the API key you just created
2. Under **Application restrictions**, select **HTTP referrers**
3. Add your domains:
   - `https://your-netlify-site.netlify.app/*`
   - `https://your-domain.co.uk/*`
   - `https://*.gohighlevel.com/*`
   - `https://*.msgsndr.com/*`
   - `http://localhost:*/*` (for local testing)
4. Under **API restrictions**, select **Restrict key** → select **Google Sheets API**
5. Click **Save**

## Step 5: Get the Sheet ID
The Sheet ID is in the URL of your Google Sheet:
```
https://docs.google.com/spreadsheets/d/SHEET_ID_IS_HERE/edit
```

## Step 6: Update site-config.js
Open `js/site-config.js` and replace:
```js
sheets: {
  apiKey: 'YOUR_GOOGLE_SHEETS_API_KEY',  // ← paste your API key
  sheetId: 'YOUR_GOOGLE_SHEET_ID',       // ← paste your Sheet ID
  cacheTTL: 5 * 60 * 1000,
},
```

## Step 7: Auto-Calculate Standings (Optional)
The included Google Apps Script auto-calculates the `standings` tab from your `fixtures` data.

### Setup:
1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code and paste the contents of `google-apps-script.js`
3. Click **Save**
4. Run `calculateStandings` from the function dropdown
5. Grant permissions when prompted

### How it works:
- Reads all **completed** fixtures from the `fixtures` tab
- Calculates W/D/L/Points for each team using RFU standard points:
  - **Win**: 4 points
  - **Draw**: 2 points
  - **Loss**: 0 points
  - **Losing bonus**: +1 point (auto-calculated if lost by 7 or fewer)
  - **Try bonus**: +1 point (enter `1` in `home_bp` or `away_bp` column)
- Writes results to the `standings` tab automatically
- Auto-runs when you edit the `fixtures` tab (via `onEdit` trigger)
- Also available from menu: **Rugby Data → Calculate Standings**

### Bonus points columns in fixtures:
- `home_bp` (optional): number of try bonus points for home team
- `away_bp` (optional): number of try bonus points for away team
If a team scores 4+ tries, enter `1` in the bonus column.

---

## Step 8: Setup Admin Panel API (NEW!)

The admin panel allows you to manage all website content through a web interface.

### Setup:
1. In your Google Sheet, go to **Extensions → Apps Script**
2. Click the **+** button to create a new file
3. Name it `AdminAPI`
4. Copy the contents of `google-apps-script-admin-api.js` and paste it
5. **IMPORTANT:** Change the password:
   ```javascript
   var CONFIG = {
     PASSWORD: "your-secure-password-here",  // Change this!
     // ...
   };
   ```
6. Click **Save**

### Deploy as Web App:
1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️ and select **Web app**
3. Configure:
   - **Description:** Admin API
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
4. Click **Deploy**
5. Review and **Authorize** the required permissions
6. **Copy the Web App URL** - you'll need this for the admin panel

### Security Notes:
- The API requires password authentication for all operations
- Change the default password immediately
- Keep the Web App URL private
- Only share admin panel access with trusted users
- Google Sheets automatically maintains version history for backups

### Using the Admin Panel:
1. Navigate to `/pages/admin.html` on your website
2. Enter:
   - **Password:** The password you set in the script
   - **Google Apps Script URL:** The Web App URL you copied
3. Click **Login**

See `ADMIN-GUIDE.md` (Persian) or `ADMIN-GUIDE-EN.md` (English) for complete documentation.

---

## Troubleshooting
| Column | Description |
|--------|-------------|
| `home_bp` | Try bonus point for home team (0 or 1) |
| `away_bp` | Try bonus point for away team (0 or 1) |

These columns are optional. If omitted, only losing bonus points are calculated.

## Step 8: Test
Open the website in a browser and check the console for any errors.

## Notes
- **Hero title**: Use `|` to create line breaks in titles (e.g., `Welcome to|Broadstreet RFC`)
- **Fixtures status**: Use `upcoming` or `completed`
- **Fixtures bonus points**: Use `home_bp` and `away_bp` columns for try bonus points (0 or 1)
- **Standings**: Auto-calculated from fixtures if you set up the Apps Script (Step 7)
- **Sponsors tier**: Use `title`, `premium`, or `partner`
- **News featured**: Use `true` for the featured article
- **Cache**: Data is cached for 5 minutes in the browser to reduce API calls
