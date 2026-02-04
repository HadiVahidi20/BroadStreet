/**
 * Broadstreet RFC - Navigation Module
 * Handles mobile navigation, dropdown menus, and sticky header
 */

const Navigation = {
  // DOM Elements
  elements: {
    mobileToggle: null,
    mobileNav: null,
    mobileOverlay: null,
    mobileClose: null,
    header: null,
    dropdowns: null,
  },

  // Configuration
  config: {
    scrollThreshold: 100,
    stickyClass: 'is-sticky',
    activeClass: 'active',
  },

  /**
   * Initialize navigation
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.setActiveNav();
  },

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements.mobileToggle = document.querySelector('.mobile-menu-toggle');
    this.elements.mobileNav = document.querySelector('.mobile-nav');
    this.elements.mobileOverlay = document.querySelector('.mobile-overlay');
    this.elements.mobileClose = document.querySelector('.mobile-nav-close');
    this.elements.header = document.querySelector('.main-header');
    this.elements.dropdowns = document.querySelectorAll('.nav-item.has-dropdown');
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Mobile menu toggle
    if (this.elements.mobileToggle) {
      this.elements.mobileToggle.addEventListener('click', () => this.toggleMobileNav());
    }

    // Mobile menu close button
    if (this.elements.mobileClose) {
      this.elements.mobileClose.addEventListener('click', () => this.closeMobileNav());
    }

    // Overlay click to close
    if (this.elements.mobileOverlay) {
      this.elements.mobileOverlay.addEventListener('click', () => this.closeMobileNav());
    }

    // Close mobile nav on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMobileNav();
      }
    });

    // Sticky header on scroll
    window.addEventListener('scroll', () => this.handleScroll());

    // Handle dropdown on touch devices
    this.elements.dropdowns.forEach((dropdown) => {
      dropdown.addEventListener('touchstart', (e) => this.handleDropdownTouch(e, dropdown));
    });
  },

  /**
   * Toggle mobile navigation
   */
  toggleMobileNav() {
    const isOpen = this.elements.mobileNav?.classList.contains(this.config.activeClass);

    if (isOpen) {
      this.closeMobileNav();
    } else {
      this.openMobileNav();
    }
  },

  /**
   * Open mobile navigation
   */
  openMobileNav() {
    this.elements.mobileNav?.classList.add(this.config.activeClass);
    this.elements.mobileOverlay?.classList.add(this.config.activeClass);
    this.elements.mobileToggle?.classList.add(this.config.activeClass);
    document.body.style.overflow = 'hidden';
  },

  /**
   * Close mobile navigation
   */
  closeMobileNav() {
    this.elements.mobileNav?.classList.remove(this.config.activeClass);
    this.elements.mobileOverlay?.classList.remove(this.config.activeClass);
    this.elements.mobileToggle?.classList.remove(this.config.activeClass);
    document.body.style.overflow = '';
  },

  /**
   * Handle scroll for sticky header
   */
  handleScroll() {
    if (!this.elements.header) return;

    if (window.scrollY > this.config.scrollThreshold) {
      this.elements.header.classList.add(this.config.stickyClass);
    } else {
      this.elements.header.classList.remove(this.config.stickyClass);
    }
  },

  /**
   * Handle dropdown touch on mobile
   */
  handleDropdownTouch(e, dropdown) {
    if (window.innerWidth >= 1024) return;

    const isOpen = dropdown.classList.contains('open');

    // Close all other dropdowns
    this.elements.dropdowns.forEach((d) => d.classList.remove('open'));

    if (!isOpen) {
      e.preventDefault();
      dropdown.classList.add('open');
    }
  },

  /**
   * Set active navigation item based on current page
   */
  setActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-nav a, .mobile-nav a');

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && currentPath.includes(href) && href !== '/') {
        link.classList.add(this.config.activeClass);
      } else if (href === '/' && currentPath === '/') {
        link.classList.add(this.config.activeClass);
      }
    });
  },
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => Navigation.init());

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Navigation;
}
