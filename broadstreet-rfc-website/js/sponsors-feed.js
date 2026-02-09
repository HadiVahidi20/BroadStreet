/**
 * Sponsors feed from Google Sheets.
 * Populates title, premium, and partner sponsor tiers on homepage.
 * Depends on: site-config.js, sheets-api.js
 */

(function () {
  var esc = SheetsAPI.esc;

  function renderSponsors(sponsors) {
    if (!sponsors.length) return;

    var title = sponsors.filter(function (s) { return (s.tier || '').toLowerCase() === 'title'; });
    var premium = sponsors.filter(function (s) { return (s.tier || '').toLowerCase() === 'premium'; });
    var partners = sponsors.filter(function (s) { return (s.tier || '').toLowerCase() === 'partner'; });

    // Title sponsor
    var titleTier = document.getElementById('sponsorTitle');
    if (titleTier && title.length) {
      var t = title[0];
      var mainWrap = titleTier.querySelector('.sponsor-main');
      if (mainWrap) {
        mainWrap.innerHTML =
          '<a href="' + esc(t.link || '#') + '" class="sponsor-card sponsor-card-main" target="_blank" rel="noopener">' +
            '<div class="sponsor-card-inner">' +
              '<div class="sponsor-badge sponsor-badge-platinum">Platinum</div>' +
              '<div class="sponsor-logo-wrapper">' +
                '<img src="' + esc(t.logo || 'assets/logos/sponsor-1.svg') + '" alt="' + esc(t.name) + '">' +
              '</div>' +
              '<div class="sponsor-info">' +
                '<h3 class="sponsor-name">' + esc(t.name) + '</h3>' +
                (t.tagline ? '<p class="sponsor-tagline">' + esc(t.tagline) + '</p>' : '') +
              '</div>' +
            '</div>' +
          '</a>';
      }
    }

    // Premium sponsors
    var premiumGrid = document.getElementById('sponsorPremium');
    if (premiumGrid && premium.length) {
      premiumGrid.innerHTML = premium.map(function (s) {
        return (
          '<a href="' + esc(s.link || '#') + '" class="sponsor-card sponsor-card-premium" target="_blank" rel="noopener">' +
            '<div class="sponsor-card-inner">' +
              '<div class="sponsor-badge sponsor-badge-gold">Gold</div>' +
              '<div class="sponsor-logo-wrapper">' +
                '<img src="' + esc(s.logo || 'assets/logos/sponsor-2.svg') + '" alt="' + esc(s.name) + '">' +
              '</div>' +
              '<div class="sponsor-info">' +
                '<h4 class="sponsor-name">' + esc(s.name) + '</h4>' +
              '</div>' +
            '</div>' +
          '</a>'
        );
      }).join('');
    }

    // Official partners
    var partnersGrid = document.getElementById('sponsorPartners');
    if (partnersGrid && partners.length) {
      partnersGrid.innerHTML = partners.map(function (s) {
        return (
          '<a href="' + esc(s.link || '#') + '" class="sponsor-card sponsor-card-partner" target="_blank" rel="noopener">' +
            '<div class="sponsor-card-inner">' +
              '<div class="sponsor-badge sponsor-badge-silver">Silver</div>' +
              '<div class="sponsor-logo-wrapper">' +
                '<img src="' + esc(s.logo || 'assets/logos/sponsor-3.svg') + '" alt="' + esc(s.name) + '">' +
              '</div>' +
            '</div>' +
          '</a>'
        );
      }).join('');
    }
  }

  async function load() {
    try {
      var sponsors = await SheetsAPI.fetchTab('sponsors');
      if (sponsors.length) renderSponsors(sponsors);
    } catch (e) {
      // Keep hardcoded placeholders
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
