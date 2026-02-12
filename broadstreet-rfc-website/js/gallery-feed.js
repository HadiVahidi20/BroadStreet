/**
 * Gallery feed from Google Sheets.
 * Fetches and renders photo gallery with filtering and pagination.
 * Depends on: site-config.js, sheets-api.js, components.js
 */

(function () {
  var esc = SheetsAPI.esc;

  // State
  var allPhotos = [];
  var filteredPhotos = [];
  var currentCategory = 'all';
  var photosPerPage = 12;
  var currentPage = 1;

  /* ── Utility Functions ── */

  function sortPhotosByDate(photos, direction) {
    var copy = photos.slice();
    copy.sort(function (a, b) {
      var dateA = new Date(a.date || '2000-01-01');
      var dateB = new Date(b.date || '2000-01-01');
      return direction === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return copy;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ── Filter Functions ── */

  function filterByCategory(category) {
    currentCategory = category;
    currentPage = 1;

    if (category === 'all') {
      filteredPhotos = allPhotos.slice();
    } else {
      filteredPhotos = allPhotos.filter(function (photo) {
        return String(photo.category || '').toLowerCase() === category.toLowerCase();
      });
    }

    renderGallery();
    updateCategoryButtons();
  }

  function updateCategoryButtons() {
    var buttons = document.querySelectorAll('.gallery-filter-btn');
    buttons.forEach(function (btn) {
      var cat = btn.dataset.category;
      if (cat === currentCategory) {
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
      }
    });
  }

  /* ── Render Functions ── */

  function renderGallery() {
    var container = document.getElementById('galleryGrid');
    if (!container) return;

    var totalPhotos = filteredPhotos.length;
    var photosToShow = currentPage * photosPerPage;
    var visiblePhotos = filteredPhotos.slice(0, photosToShow);

    if (visiblePhotos.length === 0) {
      container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-muted">No photos found in this category.</p></div>';
      updateLoadMoreButton(false);
      return;
    }

    var html = '';
    for (var i = 0; i < visiblePhotos.length; i++) {
      var photo = visiblePhotos[i];
      var thumbUrl = photo.thumbnail_url || photo.image_url || '';
      var fullUrl = photo.image_url || thumbUrl;
      var title = photo.title || 'Photo ' + (i + 1);
      var date = formatDate(photo.date);

      html += '<a href="' + esc(fullUrl) + '" class="card overflow-hidden gallery-item" data-gallery-item data-title="' + esc(title) + '" data-date="' + esc(date) + '" data-photographer="' + esc(photo.photographer || '') + '">';
      html += '<img src="' + esc(thumbUrl) + '" alt="' + esc(title) + '" style="aspect-ratio: 1; width: 100%; object-fit: cover;" loading="lazy">';
      html += '<div class="gallery-item-overlay">';
      html += '<div class="gallery-item-info">';
      html += '<h4>' + esc(title) + '</h4>';
      if (date) html += '<p class="text-sm">' + esc(date) + '</p>';
      html += '</div>';
      html += '</div>';
      html += '</a>';
    }

    container.innerHTML = html;

    // Update load more button
    var hasMore = visiblePhotos.length < totalPhotos;
    updateLoadMoreButton(hasMore);

    // Re-initialize lightbox
    initLightbox();
  }

  function updateLoadMoreButton(show) {
    var btn = document.getElementById('loadMoreBtn');
    if (!btn) return;

    if (show) {
      btn.style.display = '';
      btn.disabled = false;
    } else {
      btn.style.display = 'none';
    }
  }

  function loadMore() {
    currentPage++;
    renderGallery();
  }

  /* ── Lightbox ── */

  function initLightbox() {
    var items = document.querySelectorAll('[data-gallery-item]');
    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        openLightbox(item);
      });
    });
  }

  function openLightbox(item) {
    var imageUrl = item.href;
    var title = item.dataset.title || '';
    var date = item.dataset.date || '';
    var photographer = item.dataset.photographer || '';

    // Create lightbox
    var lightbox = document.createElement('div');
    lightbox.className = 'gallery-lightbox active';
    lightbox.innerHTML =
      '<div class="gallery-lightbox-overlay"></div>' +
      '<div class="gallery-lightbox-content">' +
      '<button class="gallery-lightbox-close">&times;</button>' +
      '<img src="' + esc(imageUrl) + '" alt="' + esc(title) + '" class="gallery-lightbox-image">' +
      '<div class="gallery-lightbox-info">' +
      '<h3>' + esc(title) + '</h3>' +
      (date ? '<p class="text-sm text-muted">' + esc(date) + '</p>' : '') +
      (photographer ? '<p class="text-sm"><strong>Photo:</strong> ' + esc(photographer) + '</p>' : '') +
      '</div>' +
      '</div>';

    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';

    // Close handlers
    var closeBtn = lightbox.querySelector('.gallery-lightbox-close');
    var overlay = lightbox.querySelector('.gallery-lightbox-overlay');

    function closeLightbox() {
      lightbox.classList.remove('active');
      setTimeout(function () {
        document.body.removeChild(lightbox);
        document.body.style.overflow = '';
      }, 300);
    }

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', closeLightbox);

    // ESC key
    function handleEsc(e) {
      if (e.key === 'Escape') {
        closeLightbox();
        document.removeEventListener('keydown', handleEsc);
      }
    }
    document.addEventListener('keydown', handleEsc);
  }

  /* ── Initialize Category Buttons ── */

  function initCategoryButtons() {
    var buttons = document.querySelectorAll('.gallery-filter-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var category = btn.dataset.category;
        filterByCategory(category);
      });
    });
  }

  /* ── Main Load ── */

  async function load() {
    var container = document.getElementById('galleryGrid');
    if (!container) return;

    try {
      var data = await SheetsAPI.fetchTab('gallery');
      allPhotos = sortPhotosByDate(data || [], 'desc');
      filteredPhotos = allPhotos.slice();

      renderGallery();
      initCategoryButtons();

      // Setup load more button
      var loadMoreBtn = document.getElementById('loadMoreBtn');
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMore);
      }

    } catch (err) {
      console.error('Gallery feed error:', err);
      container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-muted">Unable to load gallery. Please try again later.</p></div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
