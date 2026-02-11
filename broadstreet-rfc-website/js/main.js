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
    this.initParallaxEffects();
    this.initScrollReveal();
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

  /**
   * Lightweight parallax effects (no external deps)
   */
  initParallaxEffects() {
    const isHomePage = !!document.getElementById('homeNextMatch') && !!document.querySelector('.hero');
    if (!isHomePage) return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const targets = {
      heroBackgrounds: Array.from(document.querySelectorAll('.hero-bg')),
      nextMatchBackgrounds: Array.from(document.querySelectorAll('.next-match-card-bg')),
      playerShowcase: document.querySelector('.home-players-showcase'),
    };

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const getShift = (el, speed, maxShift) => {
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const delta = viewportCenter - elementCenter;
      return clamp(delta * speed, -maxShift, maxShift);
    };

    let rafId = 0;
    let ticking = false;

    const update = () => {
      ticking = false;

      targets.heroBackgrounds.forEach((bg) => {
        const shiftY = getShift(bg, 0.09, 26);
        bg.style.setProperty('--hero-pan-y', `${shiftY}px`);
      });

      targets.nextMatchBackgrounds.forEach((bg) => {
        const shiftY = getShift(bg, 0.08, 20);
        bg.style.setProperty('--parallax-shift', `${shiftY}px`);
      });

      if (targets.playerShowcase) {
        const shiftY = getShift(targets.playerShowcase, 0.04, 18);
        targets.playerShowcase.style.setProperty('--home-players-parallax', `${shiftY}px`);
      }
    };

    const queueUpdate = () => {
      if (ticking) return;
      ticking = true;
      rafId = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);

    // Initial paint after layout settles.
    queueUpdate();
    window.setTimeout(queueUpdate, 160);

    // Keep hero parallax aligned when carousel changes slides.
    const heroCarousel = document.querySelector('.hero-carousel');
    if (heroCarousel) {
      const mo = new MutationObserver(queueUpdate);
      mo.observe(heroCarousel, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    }

    // Prevent orphan RAF callback during tab switches.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        queueUpdate();
      } else if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
        ticking = false;
      }
    });
  },

  /**
   * Homepage scroll reveal effects (no external deps)
   */
  initScrollReveal() {
    const isHomePage = !!document.getElementById('homeNextMatch') && !!document.querySelector('.hero');
    if (!isHomePage) return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    const seen = new WeakSet();

    const registerReveal = (el, effect = 'up', delay = 0) => {
      if (!el || seen.has(el)) return;
      seen.add(el);
      el.classList.add('scroll-reveal');
      el.setAttribute('data-reveal', effect);
      if (delay > 0) {
        el.style.transitionDelay = `${delay}ms`;
      }
      observer.observe(el);
    };

    const revealGroup = (selector, options = {}) => {
      const {
        effect = 'up',
        startDelay = 0,
        step = 70,
        maxDelay = 420,
      } = options;
      const nodes = document.querySelectorAll(selector);
      nodes.forEach((el, index) => {
        const delay = Math.min(maxDelay, startDelay + index * step);
        registerReveal(el, effect, delay);
      });
    };

    // Major sections
    revealGroup('main > section:not(.hero)', { effect: 'up', startDelay: 0, step: 0 });

    // Staggered cards / content blocks
    revealGroup('.team-pathway-card', { effect: 'up', startDelay: 50, step: 70 });
    revealGroup('.facility-stat', { effect: 'up', startDelay: 60, step: 70 });
    revealGroup('.standings-wrapper', { effect: 'up', startDelay: 80, step: 120 });
    revealGroup('.home-player-card', { effect: 'up', startDelay: 40, step: 35 });
    revealGroup('.home-results-strip-item', { effect: 'up', startDelay: 50, step: 45 });
    revealGroup('.result-poster', { effect: 'up', startDelay: 50, step: 90 });
    revealGroup('.news-card', { effect: 'up', startDelay: 60, step: 80 });
    revealGroup('.sponsor-tier', { effect: 'up', startDelay: 70, step: 90 });

    // Dynamic feeds update after initial render; watch and reveal new children.
    const observeDynamicChildren = (containerSelector, childSelector, effect, step) => {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const apply = () => {
        const children = container.querySelectorAll(childSelector);
        children.forEach((el, index) => {
          registerReveal(el, effect, Math.min(360, index * step));
        });
      };

      apply();

      const mo = new MutationObserver(() => apply());
      mo.observe(container, { childList: true, subtree: true });
    };

    observeDynamicChildren('#homeResultsMini', '.home-results-strip-item', 'up', 40);
    observeDynamicChildren('#homePlayersTrack', '.home-player-card', 'up', 25);
    observeDynamicChildren('#homeResults', '.result-poster', 'up', 80);
    observeDynamicChildren('#homeNews', '.news-card', 'up', 70);
    observeDynamicChildren('#sponsorPremium', '.sponsor-card', 'up', 55);
    observeDynamicChildren('#sponsorPartners', '.sponsor-card', 'up', 45);
  },
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => BroadstreetRFC.init());

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BroadstreetRFC;
}
