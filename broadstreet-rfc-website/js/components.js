/**
 * Broadstreet RFC - Components Module
 * Reusable UI component functionality
 */

const Components = {
  /**
   * Initialize all components
   */
  init() {
    this.initHeroCarousel();
    this.initCountdown();
    this.initBackToTop();
    this.initTabs();
    this.initAccordion();
    this.initModal();
    this.initGallery();
  },

  /**
   * Hero Carousel Component
   */
  initHeroCarousel() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const slides = hero.querySelectorAll('.hero-slide');
    const prevBtn = hero.querySelector('.hero-prev');
    const nextBtn = hero.querySelector('.hero-next');
    const indicators = hero.querySelectorAll('.hero-indicator');

    if (slides.length === 0) return;

    let currentSlide = 0;
    let autoPlayInterval;
    const autoPlayDelay = 5000; // 5 seconds

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let isPanningBg = false;
    let hasPannedBg = false;
    let panStartOffset = 0;

    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
    const getActiveBg = () => slides[currentSlide]?.querySelector('.hero-bg');

    const resetBgPan = (slideEl) => {
      const bg = slideEl?.querySelector('.hero-bg');
      if (!bg) return;
      bg.style.setProperty('--hero-pan-x', '0px');
      bg.dataset.panX = '0';
    };

    const goToSlide = (index) => {
      // Remove active class from current slide
      slides[currentSlide].classList.remove('active');
      indicators[currentSlide]?.classList.remove('active');

      // Update current slide index
      currentSlide = (index + slides.length) % slides.length;

      // Add active class to new slide
      slides[currentSlide].classList.add('active');
      indicators[currentSlide]?.classList.add('active');
      resetBgPan(slides[currentSlide]);
    };

    const nextSlide = () => {
      goToSlide(currentSlide + 1);
    };

    const prevSlide = () => {
      goToSlide(currentSlide - 1);
    };

    const startAutoPlay = () => {
      autoPlayInterval = setInterval(nextSlide, autoPlayDelay);
    };

    const stopAutoPlay = () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
    };

    const resetAutoPlay = () => {
      stopAutoPlay();
      startAutoPlay();
    };

    // Event listeners for navigation buttons
    prevBtn?.addEventListener('click', () => {
      prevSlide();
      resetAutoPlay();
    });

    nextBtn?.addEventListener('click', () => {
      nextSlide();
      resetAutoPlay();
    });

    // Event listeners for indicators
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        goToSlide(index);
        resetAutoPlay();
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!hero.matches(':hover')) return;

      if (e.key === 'ArrowLeft') {
        prevSlide();
        resetAutoPlay();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        resetAutoPlay();
      }
    });

    // Pause on hover
    hero.addEventListener('mouseenter', stopAutoPlay);
    hero.addEventListener('mouseleave', startAutoPlay);

    // Touch/swipe support for mobile
    hero.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      touchEndX = touchStartX;
      hasPannedBg = false;
      isPanningBg = isMobile() && !e.target.closest('.hero-content, .hero-cta, .btn, .hero-indicators, .hero-nav');

      if (isPanningBg) {
        const bg = getActiveBg();
        panStartOffset = bg ? parseFloat(bg.dataset.panX || '0') : 0;
      }

      stopAutoPlay();
    }, { passive: true });

    hero.addEventListener('touchmove', (e) => {
      if (!isPanningBg) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.screenX - touchStartX;
      const deltaY = touch.screenY - touchStartY;

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        isPanningBg = false;
        return;
      }

      e.preventDefault();

      const bg = getActiveBg();
      if (!bg) return;

      const maxPan = Math.min(bg.offsetWidth * 0.18, 120);
      const nextPan = Math.max(-maxPan, Math.min(maxPan, panStartOffset + deltaX));
      bg.style.setProperty('--hero-pan-x', `${nextPan}px`);
      bg.dataset.panX = `${nextPan}`;

      if (Math.abs(deltaX) > 6) {
        hasPannedBg = true;
      }
    }, { passive: false });

    hero.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (hasPannedBg) {
        startAutoPlay();
        return;
      }
      handleSwipe();
      startAutoPlay();
    }, { passive: true });

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          nextSlide(); // Swipe left
        } else {
          prevSlide(); // Swipe right
        }
      }
    };

    // Start autoplay
    startAutoPlay();
    resetBgPan(slides[currentSlide]);

    // Stop autoplay when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });
  },

  /**
   * Countdown Timer Component
   */
  initCountdown() {
    const countdowns = document.querySelectorAll('[data-countdown]');

    countdowns.forEach((el) => {
      const targetDate = new Date(el.dataset.countdown).getTime();

      const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
          el.innerHTML = '<span class="countdown-expired">Match Started!</span>';
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        el.innerHTML = `
          <div class="countdown-item">
            <span class="countdown-value">${days}</span>
            <span class="countdown-label">Days</span>
          </div>
          <div class="countdown-item">
            <span class="countdown-value">${hours}</span>
            <span class="countdown-label">Hours</span>
          </div>
          <div class="countdown-item">
            <span class="countdown-value">${minutes}</span>
            <span class="countdown-label">Mins</span>
          </div>
          <div class="countdown-item">
            <span class="countdown-value">${seconds}</span>
            <span class="countdown-label">Secs</span>
          </div>
        `;
      };

      updateCountdown();
      setInterval(updateCountdown, 1000);
    });
  },

  /**
   * Back to Top Button
   */
  initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  },

  /**
   * Tabs Component
   */
  initTabs() {
    const tabContainers = document.querySelectorAll('[data-tabs]');

    tabContainers.forEach((container) => {
      const tabs = container.querySelectorAll('[data-tab]');
      const panels = container.querySelectorAll('[data-tab-panel]');

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const target = tab.dataset.tab;

          // Update tabs
          tabs.forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');

          // Update panels
          panels.forEach((panel) => {
            if (panel.dataset.tabPanel === target) {
              panel.classList.add('active');
              panel.style.display = 'block';
            } else {
              panel.classList.remove('active');
              panel.style.display = 'none';
            }
          });
        });
      });
    });
  },

  /**
   * Accordion Component
   */
  initAccordion() {
    const accordions = document.querySelectorAll('.accordion');

    accordions.forEach((accordion) => {
      const items = accordion.querySelectorAll('.accordion-item');

      items.forEach((item) => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');

        header?.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');

          // Close all items in this accordion
          items.forEach((i) => {
            i.classList.remove('open');
            const c = i.querySelector('.accordion-content');
            if (c) {
              c.style.maxHeight = null;
              c.style.display = 'none';
            }
          });

          // Open clicked item if it was closed
          if (!isOpen) {
            item.classList.add('open');
            if (content) {
              content.style.display = 'block';
              content.style.maxHeight = content.scrollHeight + 'px';
            }
          }
        });
      });
    });
  },

  /**
   * Modal Component
   */
  initModal() {
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.modal');

    modalTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = trigger.dataset.modal;
        const modal = document.getElementById(modalId);
        if (modal) {
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    modals.forEach((modal) => {
      // Close button
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal(modal));
      }

      // Click outside to close
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) this.closeModal(activeModal);
      }
    });
  },

  closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  /**
   * Gallery/Lightbox Component
   */
  initGallery() {
    const galleries = document.querySelectorAll('[data-gallery]');

    galleries.forEach((gallery) => {
      const items = gallery.querySelectorAll('[data-gallery-item]');

      items.forEach((item, index) => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          this.openLightbox(gallery, index);
        });
      });
    });
  },

  openLightbox(gallery, startIndex) {
    const items = gallery.querySelectorAll('[data-gallery-item]');
    let currentIndex = startIndex;

    // Create lightbox
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox active';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close">&times;</button>
        <button class="lightbox-prev">&larr;</button>
        <img class="lightbox-image" src="" alt="">
        <button class="lightbox-next">&rarr;</button>
        <div class="lightbox-counter"></div>
      </div>
    `;

    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';

    const image = lightbox.querySelector('.lightbox-image');
    const counter = lightbox.querySelector('.lightbox-counter');

    const updateLightbox = () => {
      const item = items[currentIndex];
      image.src = item.dataset.galleryItem || item.href || item.src;
      counter.textContent = `${currentIndex + 1} / ${items.length}`;
    };

    updateLightbox();

    // Event listeners
    lightbox.querySelector('.lightbox-close').addEventListener('click', () => {
      lightbox.remove();
      document.body.style.overflow = '';
    });

    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      updateLightbox();
    });

    lightbox.querySelector('.lightbox-next').addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % items.length;
      updateLightbox();
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.remove();
        document.body.style.overflow = '';
      }
    });
  },
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => Components.init());

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Components;
}
