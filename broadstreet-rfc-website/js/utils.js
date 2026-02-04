/**
 * Broadstreet RFC - Utilities Module
 * Common utility functions
 */

const Utils = {
  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   */
  debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in ms
   */
  throttle(func, limit = 250) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Format date
   * @param {Date|string} date - Date to format
   * @param {object} options - Intl.DateTimeFormat options
   */
  formatDate(date, options = {}) {
    const defaultOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat('en-GB', { ...defaultOptions, ...options }).format(
      new Date(date)
    );
  },

  /**
   * Format time
   * @param {Date|string} date - Date to format
   */
  formatTime(date) {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  },

  /**
   * Smooth scroll to element
   * @param {string|Element} target - Target element or selector
   * @param {number} offset - Offset from top
   */
  scrollTo(target, offset = 0) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;

    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top,
        behavior: 'smooth',
      });
    }
  },

  /**
   * Check if element is in viewport
   * @param {Element} element - Element to check
   * @param {number} threshold - Visibility threshold (0-1)
   */
  isInViewport(element, threshold = 0) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    return rect.top <= windowHeight * (1 - threshold) && rect.bottom >= windowHeight * threshold;
  },

  /**
   * Get URL parameters
   * @param {string} param - Parameter name (optional)
   */
  getUrlParams(param = null) {
    const params = new URLSearchParams(window.location.search);
    if (param) {
      return params.get(param);
    }
    return Object.fromEntries(params.entries());
  },

  /**
   * Set cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} days - Expiry in days
   */
  setCookie(name, value, days = 30) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  },

  /**
   * Get cookie
   * @param {string} name - Cookie name
   */
  getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
  },

  /**
   * Delete cookie
   * @param {string} name - Cookie name
   */
  deleteCookie(name) {
    this.setCookie(name, '', -1);
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  },

  /**
   * Generate unique ID
   * @param {string} prefix - ID prefix
   */
  generateId(prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Parse JSON safely
   * @param {string} str - JSON string
   * @param {*} fallback - Fallback value
   */
  parseJSON(str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  },

  /**
   * Local storage wrapper with JSON support
   */
  storage: {
    get(key, fallback = null) {
      const value = localStorage.getItem(key);
      return value ? Utils.parseJSON(value, fallback) : fallback;
    },

    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },

    remove(key) {
      localStorage.removeItem(key);
    },

    clear() {
      localStorage.clear();
    },
  },

  /**
   * Fetch wrapper with error handling
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options
   */
  async fetchData(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  /**
   * Animate element on scroll
   */
  initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const animation = entry.target.dataset.animate || 'fadeIn';
            entry.target.classList.add('animate-' + animation);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    animatedElements.forEach((el) => observer.observe(el));
  },
};

// Initialize scroll animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => Utils.initScrollAnimations());

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
