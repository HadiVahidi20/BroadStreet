/**
 * Matchday feed from Google Sheets.
 * Fetches next upcoming fixture + venue data and renders matchday page.
 * Depends on: site-config.js, sheets-api.js, components.js
 */

(function () {
  var esc = SheetsAPI.esc;
  var BROADSTREET_KEY = "broadstreet";

  /* ── Team Logos (mirrored from fixtures-feed.js) ── */

  var TEAM_LOGOS = [
    { team: "Market Harborough", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5fc21b03cdc172f6fa.png" },
    { team: "Northampton Old Scouts", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5f52c95207f5140a12.png" },
    { team: "Broadstreet", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5f7f6dcf0f8725baf6.png" },
    { team: "Bedford Athletic", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5f7f6dcfaf7e25baf7.png" },
    { team: "Peterborough", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5f715cdadf52ab3fa6.png" },
    { team: "Stamford", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5fc21b03341f72f6fb.png" },
    { team: "Kettering", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5f72139751ea9b9e59.png" },
    { team: "Oadby Wyggestonians", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5f715cda40d2ab3fa5.png" },
    { team: "Olney", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5f721397ca9e9b9e55.png" },
    { team: "Daventry", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5f7f6dcf6d4225baf5.png" },
    { team: "Old Coventrians", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5f9d6101bb76c44111.png" },
    { team: "Wellingborough", logo: "https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698ced5f3fdd0e6a89c12310.png" }
  ];

  /* ── Utility helpers (mirrored from fixtures-feed.js) ── */

  function resolveAssetPath(path) {
    var pathname = String((window && window.location && window.location.pathname) || "");
    return pathname.indexOf("/pages/") !== -1 ? "../" + path : path;
  }

  var FALLBACK_LOGO = resolveAssetPath("assets/logos/opponent-placeholder.svg");

  function normalizeTeamKey(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\brfc\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function canonicalTeamName(name) {
    return String(name || "").replace(/\s+/g, " ").replace(/\s+rfc$/i, "").trim();
  }

  var TEAM_LOGO_MAP = (function () {
    var map = {};
    for (var i = 0; i < TEAM_LOGOS.length; i++) {
      var key = normalizeTeamKey(TEAM_LOGOS[i].team);
      if (key) map[key] = TEAM_LOGOS[i].logo;
    }
    return map;
  })();

  function getTeamLogo(teamName) {
    return TEAM_LOGO_MAP[normalizeTeamKey(teamName)] || FALLBACK_LOGO;
  }

  function getDisplayTeamName(teamName) {
    return canonicalTeamName(teamName) || "TBC";
  }

  function isBroadstreet(teamName) {
    return normalizeTeamKey(teamName).indexOf(BROADSTREET_KEY) !== -1;
  }

  function isBroadstreetFixture(fixture) {
    return fixture && (isBroadstreet(fixture.home_team) || isBroadstreet(fixture.away_team));
  }

  function hasScores(fixture) {
    var home = String(fixture.home_score || "").trim();
    var away = String(fixture.away_score || "").trim();
    return home !== "" && away !== "" && !isNaN(Number(home)) && !isNaN(Number(away));
  }

  /* ── Date / time helpers (mirrored from fixtures-feed.js) ── */

  function pad2(n) { return n < 10 ? "0" + n : String(n); }

  function monthNameToIndex(name) {
    var key = String(name || "").toLowerCase();
    var map = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
      apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
      aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9,
      october: 9, nov: 10, november: 10, dec: 11, december: 11
    };
    return map.hasOwnProperty(key) ? map[key] : -1;
  }

  function normalizeTimeValue(timeValue) {
    if (timeValue === null || timeValue === undefined) return "";
    if (typeof timeValue === "number" && !isNaN(timeValue)) {
      if (timeValue >= 0 && timeValue < 1) {
        var totalMinutes = Math.round(timeValue * 24 * 60);
        var h = Math.floor(totalMinutes / 60) % 24;
        var m = totalMinutes % 60;
        return pad2(h) + ":" + pad2(m);
      }
    }
    var text = String(timeValue).trim();
    if (!text) return "";
    var mt;
    mt = text.match(/^(\d{1,2})\/(\d{1,2})\/(18\d{2}|1900)$/);
    if (mt) return "";
    mt = text.match(/^(?:1899-12-(?:30|31)|1900-01-0[01])T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?Z?$/i);
    if (mt) return mt[1] + ":" + mt[2];
    mt = text.match(/^(\d{1,2}):(\d{2})$/);
    if (mt) return pad2(parseInt(mt[1], 10)) + ":" + pad2(parseInt(mt[2], 10));
    mt = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (mt) {
      var hour = parseInt(mt[1], 10);
      var minute = parseInt(mt[2], 10);
      var ampm = mt[3].toUpperCase();
      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      return pad2(hour) + ":" + pad2(minute);
    }
    mt = text.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
    if (mt) return mt[1] + ":" + mt[2];
    var d = new Date(text);
    if (!isNaN(d.getTime())) {
      var useUtc = /z$/i.test(text) || /[+-]\d{2}:\d{2}$/.test(text);
      return pad2(useUtc ? d.getUTCHours() : d.getHours()) + ":" + pad2(useUtc ? d.getUTCMinutes() : d.getMinutes());
    }
    return text;
  }

  function parseFixtureDateValue(dateValue) {
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate(), 0, 0, 0, 0);
    }
    var text = String(dateValue || "").trim();
    if (!text) return null;
    var m;
    m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10), 0, 0, 0, 0);
    m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      var dd = parseInt(m[1], 10), mm = parseInt(m[2], 10), yyyy = parseInt(m[3], 10);
      if (yyyy > 1900 && mm >= 1 && mm <= 12) return new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
    }
    m = text.match(/^(?:[A-Za-z]+,?\s+)?(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})$/);
    if (m) {
      var day = parseInt(m[1], 10), month = monthNameToIndex(m[2]), year = parseInt(m[3], 10);
      if (month >= 0) return new Date(year, month, day, 0, 0, 0, 0);
    }
    var fallback = new Date(text);
    if (!isNaN(fallback.getTime())) return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate(), 0, 0, 0, 0);
    return null;
  }

  function parseFixtureDateTime(dateStr, timeStr) {
    var dateObj = parseFixtureDateValue(dateStr);
    if (!dateObj) return null;
    var normalized = normalizeTimeValue(timeStr);
    var mt = normalized.match(/^(\d{2}):(\d{2})$/);
    var hh = 12, mm = 0;
    if (mt) { hh = parseInt(mt[1], 10); mm = parseInt(mt[2], 10); }
    return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), hh, mm, 0, 0);
  }

  function parseMatchDateTime(dateStr, timeStr) {
    var dt = parseFixtureDateTime(dateStr, timeStr);
    return dt ? dt.toISOString() : null;
  }

  function isFixturePast(fixture) {
    var fixtureDate = parseFixtureDateValue(fixture.date);
    if (!fixtureDate) return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return fixtureDate.getTime() < today.getTime();
  }

  function getEffectiveStatus(fixture) {
    if (String(fixture.status || "").toLowerCase().trim() === "completed") return "completed";
    if (hasScores(fixture)) return "completed";
    if (isFixturePast(fixture)) return "completed";
    return "upcoming";
  }

  function toSortTime(dateStr, timeStr) {
    var dt = parseFixtureDateTime(dateStr, timeStr);
    if (dt) return dt.getTime();
    var d = parseFixtureDateValue(dateStr);
    if (d) return d.getTime();
    return 0;
  }

  function getDateParts(dateStr) {
    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var slashMatch = String(dateStr || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      var sd = parseInt(slashMatch[1], 10), sm = parseInt(slashMatch[2], 10), sy = parseInt(slashMatch[3], 10);
      if (sy > 1900 && sm >= 1 && sm <= 12) {
        var sDate = new Date(sy, sm - 1, sd);
        return { weekday: dayNames[sDate.getDay()], day: String(sd), month: monthNames[sm - 1], fullMonth: fullMonths[sm - 1], year: String(sy) };
      }
    }
    var d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return { weekday: dayNames[d.getDay()], day: String(d.getDate()), month: monthNames[d.getMonth()], fullMonth: fullMonths[d.getMonth()], year: String(d.getFullYear()) };
    }
    var match = String(dateStr || "").match(/^(?:[A-Za-z]+,?\s+)?(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})$/);
    if (match) {
      var mi = monthNameToIndex(match[2]);
      if (mi >= 0) {
        var dt2 = new Date(parseInt(match[3], 10), mi, parseInt(match[1], 10));
        return { weekday: dayNames[dt2.getDay()], day: match[1], month: monthNames[mi], fullMonth: fullMonths[mi], year: match[3] };
      }
    }
    return { weekday: "TBD", day: "-", month: "", fullMonth: "", year: "" };
  }

  function formatTime12h(timeStr) {
    var t = normalizeTimeValue(timeStr);
    var m = t.match(/^(\d{2}):(\d{2})$/);
    if (!m) return timeStr || "TBC";
    var h = parseInt(m[1], 10), min = m[2];
    var ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return h + ":" + min + " " + ampm;
  }

  /* ── Venue lookup ── */

  function findVenue(venues, teamName) {
    var key = normalizeTeamKey(teamName);
    for (var i = 0; i < venues.length; i++) {
      if (normalizeTeamKey(venues[i].team) === key) return venues[i];
    }
    return null;
  }

  /* ── Render functions ── */

  function renderMatchHero(fixture, isHome) {
    var el = document.getElementById("matchdayNextMatch");
    if (!el) return;

    var dateParts = getDateParts(fixture.date);
    var kickOff = formatTime12h(fixture.time);
    var isoDate = parseMatchDateTime(fixture.date, fixture.time);
    var badgeClass = isHome ? "home" : "away";
    var badgeText = isHome ? "Home Match" : "Away Match";

    var html = '';
    html += '<div class="matchday-hero-card">';
    html += '<div class="matchday-badge matchday-badge--' + badgeClass + '">' + badgeText + '</div>';
    html += '<div class="matchday-competition">' + esc(fixture.competition || "") + '</div>';
    html += '<div class="matchday-teams">';
    html += '<div class="matchday-team">';
    html += '<img src="' + esc(getTeamLogo(fixture.home_team)) + '" alt="' + esc(getDisplayTeamName(fixture.home_team)) + '" class="matchday-team-logo">';
    html += '<span class="matchday-team-name">' + esc(getDisplayTeamName(fixture.home_team)) + '</span>';
    html += '</div>';
    html += '<span class="matchday-vs">vs</span>';
    html += '<div class="matchday-team">';
    html += '<img src="' + esc(getTeamLogo(fixture.away_team)) + '" alt="' + esc(getDisplayTeamName(fixture.away_team)) + '" class="matchday-team-logo">';
    html += '<span class="matchday-team-name">' + esc(getDisplayTeamName(fixture.away_team)) + '</span>';
    html += '</div>';
    html += '</div>';
    html += '<div class="countdown" data-countdown="' + esc(isoDate || "") + '"></div>';
    html += '<div class="matchday-date">';
    html += esc(dateParts.weekday + ', ' + dateParts.day + ' ' + dateParts.fullMonth + ' ' + dateParts.year);
    html += ' &mdash; Kick-off ' + esc(kickOff);
    html += '</div>';

    var notes = String(fixture.match_notes || "").trim();
    if (notes) {
      html += '<div class="matchday-notes">' + esc(notes) + '</div>';
    }

    html += '</div>';
    el.innerHTML = html;

    if (typeof Components !== "undefined" && Components && typeof Components.initCountdown === "function") {
      Components.initCountdown();
    }
  }

  function renderNoUpcoming() {
    var el = document.getElementById("matchdayNextMatch");
    if (!el) return;
    el.innerHTML =
      '<div class="matchday-hero-card">' +
      '<div class="matchday-competition">No Upcoming Fixture</div>' +
      '<div class="matchday-teams">' +
      '<div class="matchday-team">' +
      '<img src="' + esc(getTeamLogo("Broadstreet")) + '" alt="Broadstreet" class="matchday-team-logo">' +
      '<span class="matchday-team-name">Broadstreet</span>' +
      '</div>' +
      '<span class="matchday-vs">vs</span>' +
      '<div class="matchday-team">' +
      '<img src="' + esc(FALLBACK_LOGO) + '" alt="TBC" class="matchday-team-logo">' +
      '<span class="matchday-team-name">TBC</span>' +
      '</div>' +
      '</div>' +
      '<div class="matchday-date">To be confirmed</div>' +
      '</div>';
  }

  function renderVenueInfo(venue, fixture, isHome) {
    var el = document.getElementById("matchdayVenue");
    if (!el) return;

    var html = '';

    if (venue) {
      html += '<h2 class="mb-4">' + (isHome ? 'Our Ground' : 'Away Venue') + '</h2>';

      html += '<h4 class="mb-2">' + esc(venue.venue_name || "Ground") + '</h4>';
      if (venue.address || venue.postcode) {
        html += '<p class="mb-4">' + esc(venue.address || "") + (venue.postcode ? '<br>' + esc(venue.postcode) : '') + '</p>';
      }

      if (venue.parking) {
        html += '<h4 class="mb-2">Parking</h4>';
        html += '<p class="mb-4">' + esc(venue.parking) + '</p>';
      }

      if (venue.facilities) {
        html += '<h4 class="mb-2">Facilities</h4>';
        html += '<p class="mb-4">' + esc(venue.facilities) + '</p>';
      }

      if (venue.entry_info) {
        html += '<h4 class="mb-2">Entry</h4>';
        html += '<p class="mb-4">' + esc(venue.entry_info) + '</p>';
      }

      if (venue.notes) {
        html += '<h4 class="mb-2">Good to Know</h4>';
        html += '<p class="mb-4">' + esc(venue.notes) + '</p>';
      }
    } else {
      html += '<h2 class="mb-4">' + (isHome ? 'Our Ground' : 'Away Venue') + '</h2>';
      if (fixture.venue) {
        html += '<p class="mb-4">' + esc(fixture.venue) + '</p>';
      } else {
        html += '<p class="text-muted">Venue details to be confirmed.</p>';
      }
    }

    el.innerHTML = html;
  }

  function extractMapsQuery(url) {
    try {
      var match = String(url || "").match(/[?&]q=([^&]+)/);
      return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
    } catch (e) {
      return "";
    }
  }

  function renderMapSection(venue) {
    var el = document.getElementById("matchdayMap");
    if (!el) return;

    if (venue && venue.google_maps_url) {
      var query = extractMapsQuery(venue.google_maps_url);
      if (!query && venue.venue_name) {
        query = (venue.venue_name || "") + " " + (venue.address || "") + " " + (venue.postcode || "");
      }
      var embedSrc = "https://www.google.com/maps?q=" + encodeURIComponent(query) + "&output=embed";

      el.innerHTML =
        '<h2 class="text-center mb-8">Find the Ground</h2>' +
        '<div class="card" style="overflow:hidden; border-radius:var(--radius-lg);">' +
        '<iframe' +
        ' src="' + esc(embedSrc) + '"' +
        ' width="100%" height="400"' +
        ' style="border:0; display:block;"' +
        ' allowfullscreen=""' +
        ' loading="lazy"' +
        ' referrerpolicy="no-referrer-when-downgrade"' +
        ' title="' + esc(venue.venue_name || "Venue") + ' Location">' +
        '</iframe>' +
        '</div>' +
        '<div class="text-center mt-6">' +
        '<a href="' + esc(venue.google_maps_url) + '" target="_blank" rel="noopener" class="btn btn-primary">Get Directions</a>' +
        '</div>';
    } else {
      el.innerHTML = '';
    }
  }

  function renderSchedule(isHome) {
    var el = document.getElementById("matchdaySchedule");
    if (!el) return;
    el.style.display = isHome ? '' : 'none';
  }

  function renderHomeInfo(isHome) {
    var el = document.getElementById("matchdayHomeInfo");
    if (!el) return;
    el.style.display = isHome ? '' : 'none';
  }

  function renderAwayInfo(isHome) {
    var el = document.getElementById("matchdayAwayInfo");
    if (!el) return;

    if (!isHome) {
      el.style.display = '';
      el.innerHTML =
        '<div class="card bg-gray-100">' +
        '<div class="card-body">' +
        '<h2 class="mb-4">Away Day Tips</h2>' +
        '<div class="alert alert-info mb-4">' +
        '<strong>Travelling Support:</strong> Show your support by wearing your Broadstreet colours on the road!' +
        '</div>' +
        '<h4 class="mb-2">What to Bring</h4>' +
        '<ul class="mb-4">' +
        '<li>Warm clothing and rain gear</li>' +
        '<li>Cash for refreshments</li>' +
        '<li>Club colours to show your support!</li>' +
        '</ul>' +
        '<h4 class="mb-2">Supporter Travel</h4>' +
        '<p>Check with the club for any organised travel or car-sharing for away fixtures.</p>' +
        '</div>' +
        '</div>';
    } else {
      el.style.display = 'none';
      el.innerHTML = '';
    }
  }

  /* ── Main load ── */

  function init() {
    var matchEl = document.getElementById("matchdayNextMatch");
    if (!matchEl) return;

    Promise.all([
      SheetsAPI.fetchTab("fixtures"),
      SheetsAPI.fetchTab("venues")
    ]).then(function (results) {
      var fixtures = results[0] || [];
      var venues = results[1] || [];

      // Filter to Broadstreet matches
      var broadstreetFixtures = [];
      for (var i = 0; i < fixtures.length; i++) {
        if (isBroadstreetFixture(fixtures[i])) broadstreetFixtures.push(fixtures[i]);
      }

      // Find next upcoming fixture (sorted by date asc)
      var upcoming = [];
      for (var j = 0; j < broadstreetFixtures.length; j++) {
        if (getEffectiveStatus(broadstreetFixtures[j]) === "upcoming") {
          upcoming.push(broadstreetFixtures[j]);
        }
      }
      upcoming.sort(function (a, b) {
        return toSortTime(a.date, a.time) - toSortTime(b.date, b.time);
      });

      var nextMatch = upcoming[0] || null;

      if (!nextMatch) {
        renderNoUpcoming();
        renderVenueInfo(null, {}, true);
        renderMapSection(null);
        renderSchedule(true);
        renderHomeInfo(true);
        renderAwayInfo(true);
        return;
      }

      var isHome = isBroadstreet(nextMatch.home_team);

      // For home match look up Broadstreet venue; for away look up the host team
      var venueTeam = isHome ? "Broadstreet" : nextMatch.home_team;
      var venue = findVenue(venues, venueTeam);

      renderMatchHero(nextMatch, isHome);
      renderVenueInfo(venue, nextMatch, isHome);
      renderMapSection(venue);
      renderSchedule(isHome);
      renderHomeInfo(isHome);
      renderAwayInfo(isHome);

    }).catch(function (err) {
      console.error("Matchday feed error:", err);
      var el = document.getElementById("matchdayNextMatch");
      if (el) {
        el.innerHTML =
          '<div class="card"><div class="card-body">' +
          '<p class="text-muted">Unable to load matchday information. Please try again later.</p>' +
          '</div></div>';
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
