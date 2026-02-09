/**
 * Fixtures, Results & Standings feed from Google Sheets.
 * Populates: homepage next-match card, standings table, recent results.
 * Also populates fixtures.html if present.
 * Depends on: site-config.js, sheets-api.js
 */

(function () {
  var esc = SheetsAPI.esc;
  var parseBool = SheetsAPI.parseBool;

  // ── Next Match Card (homepage) ──────────────────────────────────────
  function renderNextMatch(fixture) {
    var el = document.getElementById('homeNextMatch');
    if (!el || !fixture) return;

    var awayName = el.querySelector('.next-match-team:last-child .next-match-team-name');
    var competition = el.querySelector('.next-match-competition');
    var details = el.querySelectorAll('.next-match-detail-item span');
    var countdown = el.querySelector('[data-countdown]');

    if (awayName) awayName.textContent = fixture.away_team || 'TBC';
    if (competition) competition.textContent = fixture.competition || '';

    // Build date string
    var dateStr = fixture.date || '';
    var timeStr = fixture.time || '';
    if (details[0] && dateStr) details[0].textContent = dateStr;
    if (details[1] && timeStr) details[1].textContent = 'Kick-off: ' + timeStr;
    if (details[2] && fixture.venue) details[2].textContent = fixture.venue;

    // Update countdown target
    if (countdown && dateStr && timeStr) {
      var isoDate = parseMatchDateTime(dateStr, timeStr);
      if (isoDate) countdown.setAttribute('data-countdown', isoDate);
    }

    // Update home/away badge
    var badge = el.querySelector('.next-match-badge');
    if (badge) {
      var isHome = (fixture.venue || '').toLowerCase().indexOf('broadstreet') !== -1 ||
                   (fixture.home_team || '').toLowerCase().indexOf('broadstreet') !== -1;
      var badgeSpan = badge.querySelector('span') || badge.childNodes[badge.childNodes.length - 1];
      if (badgeSpan && badgeSpan.nodeType === 3) {
        badgeSpan.textContent = isHome ? 'Home Match' : 'Away Match';
      }
    }
  }

  function parseMatchDateTime(dateStr, timeStr) {
    // Try to parse common date formats into ISO for countdown
    try {
      var combined = dateStr + ' ' + timeStr;
      var d = new Date(combined);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch (e) { /* ignore */ }
    return null;
  }

  // ── League Standings (homepage) ─────────────────────────────────────
  function renderStandings(rows) {
    var tbody = document.getElementById('homeStandings');
    if (!tbody || !rows.length) return;

    tbody.innerHTML = rows.map(function (row) {
      var highlight = parseBool(row.highlight);
      return (
        '<tr' + (highlight ? ' class="highlight"' : '') + '>' +
        '<td>' + esc(row.position) + '</td>' +
        '<td class="team-name">' + esc(row.team) + '</td>' +
        '<td>' + esc(row.played) + '</td>' +
        '<td>' + esc(row.won) + '</td>' +
        '<td>' + esc(row.drawn) + '</td>' +
        '<td>' + esc(row.lost) + '</td>' +
        '<td>' + esc(row.points) + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  // ── Recent Results (homepage) ───────────────────────────────────────
  function renderResults(results) {
    var grid = document.getElementById('homeResults');
    if (!grid || !results.length) return;

    grid.innerHTML = results.map(function (r) {
      return (
        '<div class="result-poster result-poster--overlay">' +
          '<div class="result-scoreboard-bg" aria-hidden="true"></div>' +
          '<div class="result-photo">' +
            '<img src="assets/photos/score-poster.png" alt="Match result">' +
          '</div>' +
          '<div class="result-scoreboard">' +
            '<div class="result-score result-score-top">' +
              '<div class="result-number">' + esc(r.home_score) + '</div>' +
              '<div class="result-team">' +
                '<span>' + esc(r.home_team) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="result-final" aria-hidden="true"><span></span></div>' +
            '<div class="result-score result-score-bottom">' +
              '<div class="result-number">' + esc(r.away_score) + '</div>' +
              '<div class="result-team">' +
                '<span>' + esc(r.away_team) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  // ── Fixtures Page (pages/fixtures.html) ─────────────────────────────
  function renderFixturesPage(fixtures) {
    var upcoming = document.getElementById('fixturesList');
    var resultsList = document.getElementById('resultsList');
    if (!upcoming && !resultsList) return;

    var upcomingItems = fixtures.filter(function (f) { return f.status === 'upcoming'; });
    var completedItems = fixtures.filter(function (f) { return f.status === 'completed'; });

    if (upcoming && upcomingItems.length) {
      upcoming.innerHTML = upcomingItems.map(function (f) {
        return (
          '<div class="fixture-row">' +
            '<div class="fixture-date">' + esc(f.date) + '</div>' +
            '<div class="fixture-teams">' +
              '<span class="fixture-home">' + esc(f.home_team) + '</span>' +
              '<span class="fixture-vs">vs</span>' +
              '<span class="fixture-away">' + esc(f.away_team) + '</span>' +
            '</div>' +
            '<div class="fixture-info">' +
              '<span>' + esc(f.time) + '</span>' +
              '<span>' + esc(f.venue) + '</span>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }

    if (resultsList && completedItems.length) {
      resultsList.innerHTML = completedItems.map(function (f) {
        return (
          '<div class="fixture-row fixture-completed">' +
            '<div class="fixture-date">' + esc(f.date) + '</div>' +
            '<div class="fixture-teams">' +
              '<span class="fixture-home">' + esc(f.home_team) + '</span>' +
              '<span class="fixture-score">' + esc(f.home_score) + ' - ' + esc(f.away_score) + '</span>' +
              '<span class="fixture-away">' + esc(f.away_team) + '</span>' +
            '</div>' +
            '<div class="fixture-info">' + esc(f.competition) + '</div>' +
          '</div>'
        );
      }).join('');
    }
  }

  // ── Load ─────────────────────────────────────────────────────────────
  async function load() {
    try {
      var isHomepage = !!document.getElementById('homeNextMatch');
      var isFixturesPage = !!document.getElementById('fixturesList') || !!document.getElementById('resultsList');

      // Fetch fixtures and standings in parallel
      var promises = [SheetsAPI.fetchTab('fixtures')];
      if (isHomepage) promises.push(SheetsAPI.fetchTab('standings'));

      var results = await Promise.all(promises);
      var fixtures = results[0] || [];
      var standings = results[1] || [];

      if (isHomepage) {
        // Next match: first upcoming fixture
        var upcoming = fixtures.filter(function (f) { return f.status === 'upcoming'; });
        if (upcoming.length) renderNextMatch(upcoming[0]);

        // Standings
        if (standings.length) renderStandings(standings);

        // Recent results: last 3 completed
        var completed = fixtures.filter(function (f) { return f.status === 'completed'; });
        var recent = completed.slice(-3).reverse();
        if (recent.length) renderResults(recent);
      }

      if (isFixturesPage) {
        renderFixturesPage(fixtures);
      }
    } catch (e) {
      // Keep placeholders on error
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
