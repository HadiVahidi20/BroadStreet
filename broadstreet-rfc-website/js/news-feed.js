/**
 * News page: render items from /api/news (Netlify Function).
 *
 * Server response shape:
 * { featured: {title,date,category,excerpt,image,link}, items: [...] }
 */

(function () {
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function renderFeatured(item) {
    const featuredEl = byId('newsFeatured');
    if (!featuredEl || !item) return;

    const img = featuredEl.querySelector('img');
    const h2 = featuredEl.querySelector('h2');
    const p = featuredEl.querySelector('p');
    const metaDate = featuredEl.querySelector('.text-sm.text-muted');
    const metaBadge = featuredEl.querySelector('.badge.badge-outline');
    const a = featuredEl.querySelector('a.btn');

    if (img && item.image) img.src = item.image;
    if (h2) h2.textContent = item.title || 'Untitled';
    if (p) p.textContent = item.excerpt || '';
    if (metaDate) metaDate.textContent = item.date || '';
    if (metaBadge) metaBadge.textContent = item.category || '';
    if (a) {
      a.href = item.link || '#';
      const isExternal = /^https?:\/\//i.test(a.href);
      a.target = isExternal ? '_blank' : '_self';
      a.rel = isExternal ? 'noopener' : '';
    }
  }

  function renderGrid(items) {
    const gridEl = byId('newsGrid');
    if (!gridEl) return;

    if (!items || items.length === 0) {
      gridEl.innerHTML = '<p class="text-muted">No news items yet.</p>';
      return;
    }

    gridEl.innerHTML = items
      .map((item) => {
        const imgSrc = item.image ? esc(item.image) : '../assets/photos/score-poster.png';
        const title = esc(item.title || 'Untitled');
        const excerpt = esc(item.excerpt || '');
        const category = esc(item.category || 'Club News');
        const date = esc(item.date || '');
        const link = esc(item.link || '#');

        return (
          '<article class="news-card">' +
          `<img src="${imgSrc}" alt="News" class="news-card-img" style="background: var(--color-gray-200);">` +
          '<div class="news-card-body">' +
          `<span class="news-card-category">${category}</span>` +
          `<h3 class="news-card-title"><a href="${link}">${title}</a></h3>` +
          `<p class="news-card-excerpt">${excerpt}</p>` +
          `<div class="news-card-meta"><span>${date}</span></div>` +
          '</div>' +
          '</article>'
        );
      })
      .join('');
  }

  async function load() {
    try {
      const resp = await fetch('/api/news', { headers: { accept: 'application/json' } });
      if (!resp.ok) return;
      const payload = await resp.json();
      renderFeatured(payload.featured);
      renderGrid(payload.items);
    } catch {
      // Keep placeholders; do not hard-fail the page.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
