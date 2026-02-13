/**
 * Broadstreet RFC - Site Configuration
 * Centralized configuration for logos, paths, and site-wide settings
 */

const SiteConfig = {
  // Logo paths
  logos: {
    main: 'https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698eff58008498127b2713d8.png',
    favicon: 'https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698eff58008498127b2713d8.png',
    alt: 'Broadstreet RFC',
  },

  // Site information
  site: {
    name: 'Broadstreet RFC',
    tagline: 'Coventry Rugby Club',
    founded: '1929',
  },

  // Contact information
  contact: {
    email: 'info@broadstreetrfc.co.uk',
    phone: '+44 (0) 24 7667 3333',
    address: 'Broadstreet Rugby Club, Ivor Road, Coventry, CV1 4BH',
  },

  // Social media links
  social: {
    facebook: 'https://facebook.com/broadstreetrfc',
    twitter: 'https://twitter.com/broadstreetrfc',
    instagram: 'https://instagram.com/broadstreetrfc',
    youtube: 'https://youtube.com/@broadstreetrfc',
  },

  // Google Sheets integration
  sheets: {
    apiKey: 'AIzaSyDeLiOcwEJuu8sCt6UjN74-Q9pvNljeoq4',
    sheetId: '1DT5Xti6N6uc9XgXJENQuF7B29uCAVwEQYQX3F6WRVc0',
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  },

  /**
   * Initialize site-wide configurations
   */
  init() {
    this.updateLogos();
    this.updateFavicon();
  },

  /**
   * Update all logo images on the page
   */
  updateLogos() {
    // Update all images with class 'logo-img'
    const logoImages = document.querySelectorAll('.logo-img, [alt="Broadstreet RFC"]');
    logoImages.forEach((img) => {
      if (img.tagName === 'IMG') {
        img.src = this.logos.main;
        img.alt = this.logos.alt;
      }
    });
  },

  /**
   * Update favicon dynamically
   */
  updateFavicon() {
    let favicon = document.querySelector('link[rel="icon"]');

    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }

    // Determine the correct type based on file extension
    const extension = this.logos.favicon.split('.').pop().toLowerCase();
    const typeMap = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
    };

    favicon.type = typeMap[extension] || 'image/png';
    favicon.href = this.logos.favicon;
  },

  /**
   * Get logo path for specific context
   */
  getLogo(context = 'main') {
    return this.logos[context] || this.logos.main;
  },
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => SiteConfig.init());

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SiteConfig;
}
