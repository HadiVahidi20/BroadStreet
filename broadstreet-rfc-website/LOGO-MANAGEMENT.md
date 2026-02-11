# Logo Management System

## 📋 Overview

This project uses a centralized logo management system to ensure consistency across all pages.

## 🎯 Current Configuration

All pages now use the unified logo system:
- **Main Logo**: `https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698cba8f33e4ec634d172d19.png`
- **Favicon**: `https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698cba8f33e4ec634d172d19.png`

## 🔧 How It Works

### 1. Centralized Configuration
The file `js/site-config.js` contains all logo paths and site-wide settings:

```javascript
const SiteConfig = {
  logos: {
    main: 'https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698cba8f33e4ec634d172d19.png',
    favicon: 'https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698cba8f33e4ec634d172d19.png',
    alt: 'Broadstreet RFC',
  },
  // ... other settings
};
```

### 2. Automatic Updates
When any page loads, `site-config.js`:
- ✅ Updates all logo images dynamically
- ✅ Sets the correct favicon
- ✅ Ensures consistent branding

### 3. Static Fallbacks
All HTML files also have direct logo references as fallbacks:
- Header logo: `<img src="https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698cba8f33e4ec634d172d19.png">`
- Favicon: `<link rel="icon" href="https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698cba8f33e4ec634d172d19.png">`

## 🔄 Updating Logos Site-Wide

### Method 1: Using site-config.js (Recommended)

**To change the logo across ALL pages:**

1. Open `js/site-config.js`
2. Update the logo path:
   ```javascript
   logos: {
     main: '../assets/logos/YOUR-NEW-LOGO.png',
     favicon: '../assets/logos/YOUR-NEW-FAVICON.png',
   }
   ```
3. Place your new logo in `assets/logos/`
4. Refresh any page - all logos update automatically! ✨

### Method 2: Using the Update Script

If you need to update the static HTML references:

```bash
cd broadstreet-rfc-website
bash update-logos.sh
```

This script:
- Updates all logo references in HTML files
- Updates favicon links
- Ensures site-config.js is included

## 📁 File Structure

```
broadstreet-rfc-website/
├── assets/
│   └── logos/
│       └── logo-light.png          # Main logo file
├── js/
│   └── site-config.js              # Centralized configuration
├── pages/
│   ├── about.html                  # All pages include site-config.js
│   ├── teams.html
│   └── ... (all other pages)
└── update-logos.sh                 # Batch update script
```

## ✅ Pages Updated

All 16 pages now use the centralized system:
- ✅ about.html
- ✅ clubhouse.html
- ✅ community.html
- ✅ contact.html
- ✅ fan-zone.html
- ✅ fixtures.html
- ✅ gallery.html
- ✅ matchday.html
- ✅ membership.html
- ✅ news.html
- ✅ privacy.html
- ✅ safeguarding.html
- ✅ shop.html
- ✅ sponsors.html
- ✅ teams.html
- ✅ volunteering.html

## 🎨 Adding New Pages

When creating a new page:

1. Copy the header/footer from any existing page
2. Make sure to include before `</body>`:
   ```html
   <script src="../js/site-config.js"></script>
   ```
3. The logos will automatically work!

## 🔍 Troubleshooting

### Logos not updating?
1. Check browser cache (Ctrl+Shift+R to hard refresh)
2. Verify `site-config.js` is loaded in browser console
3. Check logo file exists at `https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698cba8f33e4ec634d172d19.png`

### Want different logos per page?
Modify `site-config.js` to include page-specific logic:
```javascript
updateLogos() {
  const currentPage = window.location.pathname;
  const logoPath = currentPage.includes('teams')
    ? this.logos.teams
    : this.logos.main;
  // ... rest of logic
}
```

## 📝 Best Practices

1. **Always use site-config.js** for logo changes
2. **Test on one page first** before running update script
3. **Keep logo files in `assets/logos/`** directory
4. **Use descriptive filenames** (e.g., `logo-light.png`, `logo-dark.png`)
5. **Optimize images** before uploading (keep under 200KB)

## 🎉 Benefits

- ✅ **One-line updates**: Change logo in one place, updates everywhere
- ✅ **Consistency**: All pages always use the same logo
- ✅ **Easy maintenance**: No need to manually update 16+ files
- ✅ **Future-proof**: Adding new pages is simple
- ✅ **Fallback support**: Static HTML fallbacks if JS fails

---

**Last Updated**: February 2025
**System Version**: 1.0
