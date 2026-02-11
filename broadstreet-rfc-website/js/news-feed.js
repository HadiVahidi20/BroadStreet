/**
 * News page: render items from Google Sheets via SheetsAPI.
 * Depends on: site-config.js, sheets-api.js
 */

(function () {
  var allItems = [];
  var gridItems = [];      // all non-featured items (unfiltered)
  var filteredItems = [];   // after category filter
  var currentPage = 1;
  var perPage = 6;
  var activeFilter = '';    // '' = all

  function byId(id) {
    return document.getElementById(id);
  }

  /* ── Article Modal ── */

  function openArticleModal(item) {
    var modal = byId('newsArticleModal');
    if (!modal) return;

    var imgSrc = item.image || '';
    var title = SheetsAPI.esc(item.title || 'Untitled');
    var date = SheetsAPI.esc(item.date || '');
    var category = SheetsAPI.esc(item.category || 'Club News');
    var excerpt = SheetsAPI.esc(item.excerpt || '');
    // Content is trusted HTML from admin rich text editor
    var content = item.content || '';

    var body = modal.querySelector('.news-modal-body');
    if (!body) return;

    var html = '';
    if (imgSrc) {
      html += '<img class="news-modal-hero" src="' + SheetsAPI.esc(imgSrc) + '" alt="' + title + '">';
    }
    html += '<div class="news-modal-article">';
    html += '<div class="news-modal-meta">';
    html += '<span class="badge badge-primary">' + category + '</span>';
    html += '<span class="news-modal-date">' + date + '</span>';
    html += '</div>';
    html += '<h1 class="news-modal-title">' + title + '</h1>';
    if (excerpt) {
      html += '<p class="news-modal-excerpt">' + excerpt + '</p>';
    }
    if (content) {
      html += '<div class="news-modal-content">' + content + '</div>';
    }
    html += '</div>';

    body.innerHTML = html;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Scroll modal content to top
    var contentEl = modal.querySelector('.news-modal-scroll');
    if (contentEl) contentEl.scrollTop = 0;
  }

  function closeArticleModal() {
    var modal = byId('newsArticleModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function bindModalEvents() {
    var modal = byId('newsArticleModal');
    if (!modal) return;

    var closeBtn = modal.querySelector('.news-modal-close');
    var overlay = modal.querySelector('.news-modal-overlay');

    if (closeBtn) closeBtn.addEventListener('click', closeArticleModal);
    if (overlay) overlay.addEventListener('click', closeArticleModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeArticleModal();
    });
  }

  /* ── Category Filters ── */

  function renderFilters() {
    var filtersEl = byId('newsFilters');
    if (!filtersEl) return;

    // Collect unique categories from all items (including featured)
    var seen = {};
    var categories = [];
    for (var i = 0; i < allItems.length; i++) {
      var cat = allItems[i].category || '';
      if (cat && !seen[cat]) {
        seen[cat] = true;
        categories.push(cat);
      }
    }

    // Build buttons: "All News" + each category
    var html = '<button class="btn btn-primary btn-sm" data-filter="">All News</button>';
    for (var j = 0; j < categories.length; j++) {
      html += '<button class="btn btn-outline btn-sm" data-filter="' +
        SheetsAPI.esc(categories[j]) + '">' + SheetsAPI.esc(categories[j]) + '</button>';
    }
    filtersEl.innerHTML = html;

    // Bind click handlers
    var buttons = filtersEl.querySelectorAll('button[data-filter]');
    for (var k = 0; k < buttons.length; k++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          applyFilter(btn.getAttribute('data-filter'));
        });
      })(buttons[k]);
    }
  }

  function applyFilter(category) {
    activeFilter = category;

    // Update button styles
    var filtersEl = byId('newsFilters');
    if (filtersEl) {
      var buttons = filtersEl.querySelectorAll('button[data-filter]');
      for (var i = 0; i < buttons.length; i++) {
        var btnFilter = buttons[i].getAttribute('data-filter');
        if (btnFilter === activeFilter) {
          buttons[i].className = 'btn btn-primary btn-sm';
        } else {
          buttons[i].className = 'btn btn-outline btn-sm';
        }
      }
    }

    // Filter grid items
    if (!activeFilter) {
      filteredItems = gridItems.slice();
    } else {
      filteredItems = gridItems.filter(function (item) {
        return item.category === activeFilter;
      });
    }

    // Reset to page 1 and render
    renderPage(1, false);
  }

  /* ── Render Featured ── */

  function renderFeatured(item) {
    var featuredEl = byId('newsFeatured');
    if (!featuredEl || !item) return;

    var img = featuredEl.querySelector('img');
    var h2 = featuredEl.querySelector('h2');
    var p = featuredEl.querySelector('p');
    var metaDate = featuredEl.querySelector('.text-sm.text-muted');
    var metaBadge = featuredEl.querySelector('.badge.badge-outline');
    var a = featuredEl.querySelector('a.btn');

    if (img && item.image) img.src = item.image;
    if (h2) h2.textContent = item.title || 'Untitled';
    if (p) p.textContent = item.excerpt || '';
    if (metaDate) metaDate.textContent = item.date || '';
    if (metaBadge) metaBadge.textContent = item.category || '';
    if (a) {
      a.href = '#';
      a.removeAttribute('target');
      a.removeAttribute('rel');
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openArticleModal(item);
      });
    }
  }

  /* ── Render Grid ── */

  function renderGrid(items) {
    var gridEl = byId('newsGrid');
    if (!gridEl) return;

    if (!items || items.length === 0) {
      gridEl.innerHTML = '<p class="text-muted">No news items in this category.</p>';
      return;
    }

    gridEl.innerHTML = items
      .map(function (item, idx) {
        var imgSrc = item.image ? SheetsAPI.esc(item.image) : '../assets/photos/score-poster.png';
        var title = SheetsAPI.esc(item.title || 'Untitled');
        var excerpt = SheetsAPI.esc(item.excerpt || '');
        var category = SheetsAPI.esc(item.category || 'Club News');
        var date = SheetsAPI.esc(item.date || '');

        return (
          '<article class="news-card" data-news-idx="' + idx + '" style="cursor:pointer;">' +
          '<img src="' + imgSrc + '" alt="News" class="news-card-img" style="background: var(--color-gray-200);">' +
          '<div class="news-card-body">' +
          '<span class="news-card-category">' + category + '</span>' +
          '<h3 class="news-card-title">' + title + '</h3>' +
          '<p class="news-card-excerpt">' + excerpt + '</p>' +
          '<div class="news-card-meta"><span>' + date + '</span>' +
          '<span class="news-card-read-more">Read More &rarr;</span></div>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    // Bind click handlers
    var cards = gridEl.querySelectorAll('.news-card[data-news-idx]');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('click', function () {
          var idx = parseInt(card.getAttribute('data-news-idx'), 10);
          if (items[idx]) openArticleModal(items[idx]);
        });
      })(cards[i]);
    }
  }

  /* ── Pagination ── */

  function renderPage(page, scroll) {
    currentPage = page;
    var start = (page - 1) * perPage;
    var pageItems = filteredItems.slice(start, start + perPage);
    renderGrid(pageItems);
    renderPagination();

    // Scroll to grid section (skip on initial load)
    if (scroll !== false) {
      var gridEl = byId('newsGrid');
      if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderPagination() {
    var paginationEl = byId('newsPagination');
    if (!paginationEl) return;

    var totalPages = Math.ceil(filteredItems.length / perPage);

    // Hide pagination if only 1 page or no items
    if (totalPages <= 1) {
      paginationEl.style.display = 'none';
      return;
    }

    paginationEl.style.display = 'flex';
    var html = '';

    // Previous button
    html += '<button class="btn btn-outline btn-sm" data-page="prev"' +
      (currentPage <= 1 ? ' disabled' : '') + '>&larr; Previous</button>';

    // Page numbers
    for (var i = 1; i <= totalPages; i++) {
      var cls = i === currentPage ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
      html += '<button class="' + cls + '" data-page="' + i + '">' + i + '</button>';
    }

    // Next button
    html += '<button class="btn btn-outline btn-sm" data-page="next"' +
      (currentPage >= totalPages ? ' disabled' : '') + '>Next &rarr;</button>';

    paginationEl.innerHTML = html;

    // Bind click handlers
    var buttons = paginationEl.querySelectorAll('button[data-page]');
    for (var j = 0; j < buttons.length; j++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var val = btn.getAttribute('data-page');
          var totalP = Math.ceil(filteredItems.length / perPage);
          if (val === 'prev' && currentPage > 1) {
            renderPage(currentPage - 1);
          } else if (val === 'next' && currentPage < totalP) {
            renderPage(currentPage + 1);
          } else {
            var num = parseInt(val, 10);
            if (!isNaN(num)) renderPage(num);
          }
        });
      })(buttons[j]);
    }
  }

  /* ── Load ── */

  async function load() {
    try {
      var rows = await SheetsAPI.fetchTab('news');
      if (!rows.length) return;

      allItems = rows.map(function (x) {
        return {
          title: String(x.title || '').trim(),
          date: String(x.date || '').trim(),
          category: String(x.category || '').trim(),
          excerpt: String(x.excerpt || '').trim(),
          content: String(x.content || '').trim(),
          image: String(x.image || '').trim(),
          featured: SheetsAPI.parseBool(x.featured),
        };
      });

      var featuredItem = allItems.find(function (i) { return i.featured; }) || allItems[0];
      gridItems = allItems.filter(function (i) { return i !== featuredItem; });
      filteredItems = gridItems.slice();

      renderFeatured(featuredItem);
      renderFilters();
      renderPage(1, false);
      bindModalEvents();
    } catch (e) {
      // Keep placeholders; do not hard-fail the page.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
