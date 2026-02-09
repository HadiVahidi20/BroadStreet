/**
 * News page: render items from Google Sheets via SheetsAPI.
 * Depends on: site-config.js, sheets-api.js
 */

(function () {
  function byId(id) {
    return document.getElementById(id);
  }

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
      a.href = item.link || '#';
      var isExternal = /^https?:\/\//i.test(a.href);
      a.target = isExternal ? '_blank' : '_self';
      a.rel = isExternal ? 'noopener' : '';
    }
  }

  function renderGrid(items) {
    var gridEl = byId('newsGrid');
    if (!gridEl) return;

    if (!items || items.length === 0) {
      gridEl.innerHTML = '<p class="text-muted">No news items yet.</p>';
      return;
    }

    gridEl.innerHTML = items
      .map(function (item) {
        var imgSrc = item.image ? SheetsAPI.esc(item.image) : '../assets/photos/score-poster.png';
        var title = SheetsAPI.esc(item.title || 'Untitled');
        var excerpt = SheetsAPI.esc(item.excerpt || '');
        var category = SheetsAPI.esc(item.category || 'Club News');
        var date = SheetsAPI.esc(item.date || '');
        var link = SheetsAPI.esc(item.link || '#');

        return (
          '<article class="news-card">' +
          '<img src="' + imgSrc + '" alt="News" class="news-card-img" style="background: var(--color-gray-200);">' +
          '<div class="news-card-body">' +
          '<span class="news-card-category">' + category + '</span>' +
          '<h3 class="news-card-title"><a href="' + link + '">' + title + '</a></h3>' +
          '<p class="news-card-excerpt">' + excerpt + '</p>' +
          '<div class="news-card-meta"><span>' + date + '</span></div>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');
  }

  async function load() {
    try {
      var rows = await SheetsAPI.fetchTab('news');
      if (!rows.length) return;

      var items = rows.map(function (x) {
        return {
          title: String(x.title || '').trim(),
          date: String(x.date || '').trim(),
          category: String(x.category || '').trim(),
          excerpt: String(x.excerpt || '').trim(),
          image: String(x.image || '').trim(),
          link: String(x.link || '').trim(),
          featured: SheetsAPI.parseBool(x.featured),
        };
      });

      var featuredItem = items.find(function (i) { return i.featured; }) || items[0];
      var rest = items.filter(function (i) { return i !== featuredItem; });

      renderFeatured(featuredItem);
      renderGrid(rest);
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
