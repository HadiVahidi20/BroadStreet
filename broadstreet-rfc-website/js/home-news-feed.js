/**
 * Homepage news: render latest items from Google Sheets into #homeNews.
 * Shows 1 featured + 2 compact cards matching the existing layout.
 * Depends on: site-config.js, sheets-api.js
 */

(function () {
  var clockIcon =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">' +
    '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>' +
    '</svg>';

  var arrowIcon =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">' +
    '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>' +
    '</svg>';

  function esc(s) { return SheetsAPI.esc(s); }

  function renderFeaturedCard(item) {
    var img = item.image ? esc(item.image) : 'assets/photos/score-poster.png';
    return (
      '<article class="news-card news-card-featured">' +
        '<div class="news-card-image-wrapper">' +
          '<img src="' + img + '" alt="' + esc(item.title) + '" class="news-card-img">' +
          '<div class="news-card-overlay"></div>' +
          '<span class="news-card-badge badge-primary">Featured</span>' +
        '</div>' +
        '<div class="news-card-body">' +
          '<div class="news-card-header">' +
            '<span class="news-card-category">' + esc(item.category || 'Club News') + '</span>' +
            '<span class="news-card-date">' + clockIcon + ' ' + esc(item.date) + '</span>' +
          '</div>' +
          '<h3 class="news-card-title">' + esc(item.title) + '</h3>' +
          '<p class="news-card-excerpt">' + esc(item.excerpt) + '</p>' +
          '<div class="news-card-footer">' +
            '<a href="pages/news.html" class="news-card-read-more">Read More ' + arrowIcon + '</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderCompactCard(item) {
    var img = item.image ? esc(item.image) : 'assets/photos/score-poster.png';
    return (
      '<article class="news-card news-card-compact">' +
        '<div class="news-card-image-wrapper">' +
          '<img src="' + img + '" alt="' + esc(item.title) + '" class="news-card-img">' +
          '<div class="news-card-overlay"></div>' +
        '</div>' +
        '<div class="news-card-body">' +
          '<div class="news-card-header">' +
            '<span class="news-card-category">' + esc(item.category || 'Club News') + '</span>' +
            '<span class="news-card-date">' + clockIcon + ' ' + esc(item.date) + '</span>' +
          '</div>' +
          '<h3 class="news-card-title">' + esc(item.title) + '</h3>' +
          '<p class="news-card-excerpt">' + esc(item.excerpt) + '</p>' +
          '<a href="pages/news.html" class="news-card-read-more">Read More ' + arrowIcon + '</a>' +
        '</div>' +
      '</article>'
    );
  }

  async function load() {
    var container = document.getElementById('homeNews');
    if (!container) return;

    try {
      var rows = await SheetsAPI.fetchTab('news');
      if (!rows || !rows.length) return;

      var items = rows.map(function (x) {
        return {
          title: String(x.title || '').trim(),
          date: String(x.date || '').trim(),
          category: String(x.category || '').trim(),
          excerpt: String(x.excerpt || '').trim(),
          image: String(x.image || '').trim(),
          featured: SheetsAPI.parseBool(x.featured),
        };
      });

      var featuredItem = items.find(function (i) { return i.featured; }) || items[0];
      var rest = items.filter(function (i) { return i !== featuredItem; }).slice(0, 2);

      var html = renderFeaturedCard(featuredItem);
      for (var i = 0; i < rest.length; i++) {
        html += renderCompactCard(rest[i]);
      }

      container.innerHTML = html;
    } catch (e) {
      // Keep hardcoded fallback visible
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
