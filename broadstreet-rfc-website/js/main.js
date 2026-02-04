/**
 * Broadstreet RFC - Main JavaScript Entry Point
 * ============================================
 *
 * This file initializes all JavaScript modules and global functionality.
 *
 * Modules:
 * - navigation.js: Mobile nav, dropdowns, sticky header
 * - components.js: UI components (countdown, tabs, modals, etc.)
 * - utils.js: Utility functions
 */

// Main App Object
const BroadstreetRFC = {
  /**
   * Initialize the application
   */
  init() {
    this.initNewsletter();
    this.initContactForm();
    this.initSmoothScroll();
    this.initLazyLoad();
    console.log('Broadstreet RFC Website Initialized');
  },

  /**
   * Newsletter form submission
   */
  initNewsletter() {
    const forms = document.querySelectorAll('.footer-newsletter-form, .newsletter-form');

    forms.forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;

        // Here you would typically send to your backend/email service
        console.log('Newsletter signup:', email);

        // Show success message
        const button = form.querySelector('button');
        const originalText = button.textContent;
        button.textContent = 'Subscribed!';
        button.disabled = true;

        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
          form.reset();
        }, 3000);
      });
    });
  },

  /**
   * Contact form handling
   */
  initContactForm() {
    const contactForms = document.querySelectorAll('.contact-form');

    contactForms.forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Basic validation
        if (!this.validateForm(form)) {
          return;
        }

        // Here you would send to your backend
        console.log('Form submitted:', data);

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'alert alert-success';
        successMsg.textContent = 'Thank you for your message. We will get back to you soon!';

        form.parentNode.insertBefore(successMsg, form);
        form.reset();

        setTimeout(() => successMsg.remove(), 5000);
      });
    });
  },

  /**
   * Basic form validation
   */
  validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach((field) => {
      const errorEl = field.parentNode.querySelector('.form-error');

      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('error');
        if (errorEl) errorEl.textContent = 'This field is required';
      } else if (field.type === 'email' && !this.isValidEmail(field.value)) {
        isValid = false;
        field.classList.add('error');
        if (errorEl) errorEl.textContent = 'Please enter a valid email';
      } else {
        field.classList.remove('error');
        if (errorEl) errorEl.textContent = '';
      }
    });

    return isValid;
  },

  /**
   * Email validation
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Smooth scroll for anchor links
   */
  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
          const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;
          const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

          window.scrollTo({
            top,
            behavior: 'smooth',
          });
        }
      });
    });
  },

  /**
   * Lazy load images
   */
  initLazyLoad() {
    const lazyImages = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      lazyImages.forEach((img) => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      lazyImages.forEach((img) => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  },
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => BroadstreetRFC.init());

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BroadstreetRFC;
}
