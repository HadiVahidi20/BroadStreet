/**
 * Fixtures, Results and Standings feed from Google Sheets.
 * Filters fixtures to Broadstreet matches and renders team logos.
 * Depends on: site-config.js, sheets-api.js
 */

(function () {
  var esc = SheetsAPI.esc;
  var parseBool = SheetsAPI.parseBool;
  var BROADSTREET_KEY = "broadstreet";

  var TEAM_LOGOS = [
    { team: "Market Harborough", logo: "https://images.englandrugby.com/club_images/13377.png" },
    { team: "Northampton Old Scouts", logo: "https://images.englandrugby.com/club_images/14907.png" },
    { team: "Broadstreet", logo: "https://images.englandrugby.com/club_images/3366.png" },
    { team: "Bedford Athletic", logo: "https://images.englandrugby.com/club_images/1822.png" },
    { team: "Peterborough", logo: "https://images.englandrugby.com/club_images/16819.png" },
    { team: "Stamford", logo: "https://images.englandrugby.com/club_images/20850.png" },
    { team: "Kettering", logo: "https://images.englandrugby.com/club_images/11346.png" },
    { team: "Oadby Wyggestonians", logo: "https://images.englandrugby.com/club_images/15254.png" },
    { team: "Olney", logo: "https://images.englandrugby.com/club_images/16184.png" },
    { team: "Daventry", logo: "https://images.englandrugby.com/club_images/6224.png" },
    { team: "Old Coventrians", logo: "https://images.englandrugby.com/club_images/15578.png" },
    { team: "Wellingborough", logo: "https://images.englandrugby.com/club_images/24604.png" }
  ];

  var TEAM_LOGO_MAP = buildTeamLogoMap_(TEAM_LOGOS);
  var FALLBACK_LOGO = resolveAssetPath_("assets/logos/opponent-placeholder.svg");

  function resolveAssetPath_(path) {
    var pathname = String((window && window.location && window.location.pathname) || "");
    return pathname.indexOf("/pages/") !== -1 ? "../" + path : path;
  }

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

  function buildTeamLogoMap_(rows) {
    var map = {};
    for (var i = 0; i < rows.length; i++) {
      var item = rows[i];
      var key = normalizeTeamKey(item.team);
      if (!key) continue;
      map[key] = item.logo;
    }
    return map;
  }

  function getTeamLogo(teamName) {
    var key = normalizeTeamKey(teamName);
    return TEAM_LOGO_MAP[key] || FALLBACK_LOGO;
  }

  function getDisplayTeamName(teamName) {
    var clean = canonicalTeamName(teamName);
    return clean || "TBC";
  }

  function isBroadstreet(teamName) {
    return normalizeTeamKey(teamName).indexOf(BROADSTREET_KEY) !== -1;
  }

  function isBroadstreetFixture(fixture) {
    if (!fixture) return false;
    return isBroadstreet(fixture.home_team) || isBroadstreet(fixture.away_team);
  }

  function hasScores(fixture) {
    var home = String(fixture.home_score || "").trim();
    var away = String(fixture.away_score || "").trim();
    return home !== "" && away !== "" && !isNaN(Number(home)) && !isNaN(Number(away));
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

  function renderTeamWithLogo(teamName, className) {
    var displayName = getDisplayTeamName(teamName);
    var logo = getTeamLogo(teamName);
    return (
      '<span class="' +
      esc(className || "team-inline") +
      '">' +
      '<img class="team-inline-logo" src="' +
      esc(logo) +
      '" alt="' +
      esc(displayName) +
      ' logo" loading="lazy">' +
      "<span>" +
      esc(displayName) +
      "</span>" +
      "</span>"
    );
  }

  function getDateParts(dateStr) {
    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // DD/MM/YYYY — Google Sheets auto-converted dates
    var slashMatch = String(dateStr || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      var sd = parseInt(slashMatch[1], 10);
      var sm = parseInt(slashMatch[2], 10);
      var sy = parseInt(slashMatch[3], 10);
      if (sy > 1900 && sm >= 1 && sm <= 12) {
        var sDate = new Date(sy, sm - 1, sd);
        return {
          weekday: dayNames[sDate.getDay()],
          day: String(sd),
          month: monthNames[sm - 1]
        };
      }
    }

    var d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return {
        weekday: dayNames[d.getDay()],
        day: String(d.getDate()),
        month: monthNames[d.getMonth()]
      };
    }

    var match = String(dateStr || "").match(/^([A-Za-z]+)\s+(\d{1,2})\s+([A-Za-z]{3,})/);
    if (match) {
      return {
        weekday: match[1].slice(0, 3),
        day: match[2],
        month: match[3].slice(0, 3)
      };
    }

    return { weekday: "TBD", day: "-", month: "" };
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function monthNameToIndex(name) {
    var key = String(name || "").toLowerCase();
    var map = {
      jan: 0,
      january: 0,
      feb: 1,
      february: 1,
      mar: 2,
      march: 2,
      apr: 3,
      april: 3,
      may: 4,
      jun: 5,
      june: 5,
      jul: 6,
      july: 6,
      aug: 7,
      august: 7,
      sep: 8,
      sept: 8,
      september: 8,
      oct: 9,
      october: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11
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

    // Detect Google Sheets epoch date (30/12/1899, 31/12/1899, etc.) — corrupted time value
    var m;
    m = text.match(/^(\d{1,2})\/(\d{1,2})\/(18\d{2}|1900)$/);
    if (m) return "";

    m = text.match(/^(?:1899-12-(?:30|31)|1900-01-0[01])T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?Z?$/i);
    if (m) return m[1] + ":" + m[2];

    m = text.match(/^(\d{1,2}):(\d{2})$/);
    if (m) return pad2(parseInt(m[1], 10)) + ":" + pad2(parseInt(m[2], 10));

    m = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m) {
      var hour = parseInt(m[1], 10);
      var minute = parseInt(m[2], 10);
      var ampm = m[3].toUpperCase();
      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      return pad2(hour) + ":" + pad2(minute);
    }

    m = text.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
    if (m) return m[1] + ":" + m[2];

    var d = new Date(text);
    if (!isNaN(d.getTime())) {
      var useUtc = /z$/i.test(text) || /[+-]\d{2}:\d{2}$/.test(text);
      var hh = useUtc ? d.getUTCHours() : d.getHours();
      var mm = useUtc ? d.getUTCMinutes() : d.getMinutes();
      return pad2(hh) + ":" + pad2(mm);
    }

    return text;
  }

  function parseFixtureDateValue(dateValue) {
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate(), 0, 0, 0, 0);
    }

    var text = String(dateValue || "").trim();
    if (!text) return null;

    var m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10), 0, 0, 0, 0);
    }

    // DD/MM/YYYY — Google Sheets auto-converted dates
    m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      var dd = parseInt(m[1], 10);
      var mm = parseInt(m[2], 10);
      var yyyy = parseInt(m[3], 10);
      if (yyyy > 1900 && mm >= 1 && mm <= 12) {
        return new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
      }
    }

    m = text.match(/^(?:[A-Za-z]+,?\s+)?(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})$/);
    if (m) {
      var day = parseInt(m[1], 10);
      var month = monthNameToIndex(m[2]);
      var year = parseInt(m[3], 10);
      if (month >= 0) {
        return new Date(year, month, day, 0, 0, 0, 0);
      }
    }

    var fallback = new Date(text);
    if (!isNaN(fallback.getTime())) {
      return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate(), 0, 0, 0, 0);
    }

    return null;
  }

  function parseFixtureDateTime(dateStr, timeStr) {
    var dateObj = parseFixtureDateValue(dateStr);
    if (!dateObj) return null;

    var normalizedTime = normalizeTimeValue(timeStr);
    var m = normalizedTime.match(/^(\d{2}):(\d{2})$/);
    var hh = 12;
    var mm = 0;

    if (m) {
      hh = parseInt(m[1], 10);
      mm = parseInt(m[2], 10);
    }

    return new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      hh,
      mm,
      0,
      0
    );
  }

  function parseMatchDateTime(dateStr, timeStr) {
    var dt = parseFixtureDateTime(dateStr, timeStr);
    return dt ? dt.toISOString() : null;
  }

  function toSortTime(dateStr, timeStr) {
    var dt = parseFixtureDateTime(dateStr, timeStr);
    if (dt) return dt.getTime();

    var d = parseFixtureDateValue(dateStr);
    if (d) return d.getTime();
    return 0;
  }

  function formatPd(value) {
    var n = Number(value);
    if (isNaN(n)) return String(value || "");
    if (n > 0) return "+" + n;
    return String(n);
  }

  function sortFixturesByDate(fixtures, direction) {
    var copy = (fixtures || []).slice();
    copy.sort(function (a, b) {
      var left = toSortTime(a.date, a.time);
      var right = toSortTime(b.date, b.time);
      return direction === "desc" ? right - left : left - right;
    });
    return copy;
  }

  function renderNextMatch(fixture) {
    var el = document.getElementById("homeNextMatch");
    if (!el || !fixture) return;

    var homeName = el.querySelector(".next-match-team:first-child .next-match-team-name");
    var awayName = el.querySelector(".next-match-team:last-child .next-match-team-name");
    var homeLogo = el.querySelector(".next-match-team:first-child .next-match-team-logo img");
    var awayLogo = el.querySelector(".next-match-team:last-child .next-match-team-logo img");
    var competition = el.querySelector(".next-match-competition");
    var details = el.querySelectorAll(".next-match-detail-item span");
    var countdown = el.querySelector("[data-countdown]");

    if (homeName) homeName.textContent = getDisplayTeamName(fixture.home_team);
    if (awayName) awayName.textContent = getDisplayTeamName(fixture.away_team);

    if (homeLogo) {
      homeLogo.src = getTeamLogo(fixture.home_team);
      homeLogo.alt = getDisplayTeamName(fixture.home_team);
    }
    if (awayLogo) {
      awayLogo.src = getTeamLogo(fixture.away_team);
      awayLogo.alt = getDisplayTeamName(fixture.away_team);
    }

    if (competition) competition.textContent = fixture.competition || "";

    var dateStr = fixture.date || "";
    var timeStr = normalizeTimeValue(fixture.time || "");
    if (details[0]) details[0].textContent = dateStr || "To be confirmed";
    if (details[1]) details[1].textContent = "Kick-off: " + (timeStr || "TBC");
    if (details[2]) details[2].textContent = fixture.venue || "Venue: TBC";

    if (countdown && dateStr && timeStr) {
      var isoDate = parseMatchDateTime(dateStr, timeStr);
      if (isoDate) {
        countdown.setAttribute("data-countdown", isoDate);
      } else {
        countdown.setAttribute("data-countdown", "");
      }
      if (typeof Components !== "undefined" && Components && typeof Components.initCountdown === "function") {
        Components.initCountdown();
      }
    } else if (countdown) {
      countdown.setAttribute("data-countdown", "");
      if (typeof Components !== "undefined" && Components && typeof Components.initCountdown === "function") {
        Components.initCountdown();
      }
    }

    var badge = el.querySelector(".next-match-badge");
    if (badge) {
      var broadstreetAtHome = isBroadstreet(fixture.home_team);
      var badgeText = broadstreetAtHome ? "Home Match" : "Away Match";
      var textNode = badge.childNodes[badge.childNodes.length - 1];
      if (textNode && textNode.nodeType === 3) {
        textNode.textContent = " " + badgeText;
      } else {
        badge.appendChild(document.createTextNode(" " + badgeText));
      }
    }
  }

  function renderNoUpcomingNextMatch() {
    var el = document.getElementById("homeNextMatch");
    if (!el) return;

    var homeName = el.querySelector(".next-match-team:first-child .next-match-team-name");
    var awayName = el.querySelector(".next-match-team:last-child .next-match-team-name");
    var homeLogo = el.querySelector(".next-match-team:first-child .next-match-team-logo img");
    var awayLogo = el.querySelector(".next-match-team:last-child .next-match-team-logo img");
    var competition = el.querySelector(".next-match-competition");
    var details = el.querySelectorAll(".next-match-detail-item span");
    var countdown = el.querySelector("[data-countdown]");
    var badge = el.querySelector(".next-match-badge");

    if (homeName) homeName.textContent = "Broadstreet";
    if (awayName) awayName.textContent = "TBC";
    if (homeLogo) {
      homeLogo.src = getTeamLogo("Broadstreet");
      homeLogo.alt = "Broadstreet";
    }
    if (awayLogo) {
      awayLogo.src = FALLBACK_LOGO;
      awayLogo.alt = "TBC";
    }

    if (competition) competition.textContent = "No Upcoming Fixture";
    if (details[0]) details[0].textContent = "To be confirmed";
    if (details[1]) details[1].textContent = "Kick-off: TBC";
    if (details[2]) details[2].textContent = "Venue: TBC";

    if (countdown) {
      countdown.setAttribute("data-countdown", "");
      if (typeof Components !== "undefined" && Components && typeof Components.initCountdown === "function") {
        Components.initCountdown();
      } else {
        countdown.innerHTML = '<span class="countdown-expired">Fixture Time TBC</span>';
      }
    }

    if (badge) {
      var textNode = badge.childNodes[badge.childNodes.length - 1];
      if (textNode && textNode.nodeType === 3) {
        textNode.textContent = " Fixture TBC";
      } else {
        badge.appendChild(document.createTextNode(" Fixture TBC"));
      }
    }
  }

  function renderHomeStandings(rows) {
    var tbody = document.getElementById("homeStandings");
    if (!tbody || !rows.length) return;

    tbody.innerHTML = rows
      .map(function (row) {
        var highlight = parseBool(row.highlight);
        return (
          "<tr" +
          (highlight ? ' class="highlight"' : "") +
          ">" +
          "<td>" +
          esc(row.position) +
          "</td>" +
          '<td class="team-name">' +
          renderTeamWithLogo(row.team, "team-inline") +
          "</td>" +
          "<td>" +
          esc(row.played) +
          "</td>" +
          "<td>" +
          esc(row.won) +
          "</td>" +
          "<td>" +
          esc(row.drawn) +
          "</td>" +
          "<td>" +
          esc(row.lost) +
          "</td>" +
          "<td>" +
          esc(row.points) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderHomeResults(results) {
    var grid = document.getElementById("homeResults");
    if (!grid || !results.length) return;

    grid.innerHTML = results
      .map(function (r) {
        return (
          '<div class="result-poster result-poster--overlay">' +
          '<div class="result-scoreboard-bg" aria-hidden="true"></div>' +
          '<div class="result-photo">' +
          '<img src="assets/photos/score-poster.png" alt="Match result">' +
          "</div>" +
          '<div class="result-scoreboard">' +
          '<div class="result-score result-score-top">' +
          '<div class="result-number">' +
          esc(r.home_score) +
          "</div>" +
          '<div class="result-team">' +
          renderTeamWithLogo(r.home_team, "result-team-inline") +
          "</div>" +
          "</div>" +
          '<div class="result-final" aria-hidden="true"><span></span></div>' +
          '<div class="result-score result-score-bottom">' +
          '<div class="result-number">' +
          esc(r.away_score) +
          "</div>" +
          '<div class="result-team">' +
          renderTeamWithLogo(r.away_team, "result-team-inline") +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderFixturesStandings(rows) {
    var tbody = document.getElementById("fixturesStandings");
    if (!tbody) return;

    if (!rows || !rows.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">No standings data available.</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map(function (row) {
        var highlight = parseBool(row.highlight);
        return (
          "<tr" +
          (highlight ? ' class="highlight"' : "") +
          ">" +
          "<td>" +
          esc(row.position) +
          "</td>" +
          '<td class="team-name">' +
          renderTeamWithLogo(row.team, "team-inline") +
          "</td>" +
          "<td>" +
          esc(row.played) +
          "</td>" +
          "<td>" +
          esc(row.won) +
          "</td>" +
          "<td>" +
          esc(row.drawn) +
          "</td>" +
          "<td>" +
          esc(row.lost) +
          "</td>" +
          "<td>" +
          esc(row.pf) +
          "</td>" +
          "<td>" +
          esc(row.pa) +
          "</td>" +
          "<td>" +
          esc(formatPd(row.pd)) +
          "</td>" +
          "<td><strong>" +
          esc(row.points) +
          "</strong></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function updateFixturesStandingsTitle(fixtures) {
    var title = document.getElementById("fixturesStandingsTitle");
    if (!title) return;

    var competition = "";
    if (fixtures && fixtures.length) {
      for (var i = 0; i < fixtures.length; i++) {
        var comp = String((fixtures[i] && fixtures[i].competition) || "").trim();
        if (comp) {
          competition = comp;
          break;
        }
      }
    }

    title.textContent = competition ? competition + " Standings" : "League Standings";
  }

  function renderFixturesPage(fixtures) {
    var upcoming = document.getElementById("fixturesList");
    var resultsList = document.getElementById("resultsList");
    if (!upcoming && !resultsList) return;

    var upcomingItems = sortFixturesByDate(
      fixtures.filter(function (f) {
        return getEffectiveStatus(f) === "upcoming";
      }),
      "asc"
    );

    var completedItems = sortFixturesByDate(
      fixtures.filter(function (f) {
        return getEffectiveStatus(f) === "completed";
      }),
      "desc"
    );

    if (upcoming) {
      if (!upcomingItems.length) {
        upcoming.innerHTML = '<div class="card"><div class="card-body"><p class="text-muted">No upcoming Broadstreet fixtures found.</p></div></div>';
      } else {
        upcoming.innerHTML = upcomingItems
          .map(function (f) {
            var parts = getDateParts(f.date);
            var isHome = isBroadstreet(f.home_team);
            var kickOff = normalizeTimeValue(f.time || "");

            return (
              '<div class="card">' +
              '<div class="card-body flex items-center justify-between flex-wrap gap-4">' +
              '<div class="flex items-center gap-6">' +
              '<div class="text-center">' +
              '<div class="text-sm text-muted uppercase tracking-wider">' +
              esc(parts.weekday) +
              "</div>" +
              '<div class="text-2xl font-bold">' +
              esc(parts.day) +
              "</div>" +
              '<div class="text-sm text-muted">' +
              esc(parts.month) +
              "</div>" +
              "</div>" +
              "<div>" +
              '<span class="badge ' +
              (isHome ? "badge-secondary" : "badge-info") +
              ' mb-2">' +
              (isHome ? "Home" : "Away") +
              "</span>" +
              '<h3 class="text-lg font-bold mb-1 fixture-teams-line">' +
              renderTeamWithLogo(f.home_team, "fixture-team-inline") +
              '<span class="fixture-vs">vs</span>' +
              renderTeamWithLogo(f.away_team, "fixture-team-inline") +
              "</h3>" +
              '<p class="text-sm text-muted">' +
              esc(f.competition || "") +
              (kickOff ? " - Kick-off " + esc(kickOff) : "") +
              (f.venue ? " - " + esc(f.venue) : "") +
              "</p>" +
              "</div>" +
              "</div>" +
              '<a href="matchday.html" class="btn btn-outline btn-sm">Matchday Info</a>' +
              "</div>" +
              "</div>"
            );
          })
          .join("");
      }
    }

    if (resultsList) {
      if (!completedItems.length) {
        resultsList.innerHTML = '<div class="card"><div class="card-body"><p class="text-muted">No completed Broadstreet results found.</p></div></div>';
      } else {
        resultsList.innerHTML = completedItems
          .map(function (f) {
            var parts = getDateParts(f.date);
            var homeScore = Number(f.home_score);
            var awayScore = Number(f.away_score);
            var broadHome = isBroadstreet(f.home_team);
            var broadAway = isBroadstreet(f.away_team);
            var outcome = "Completed";
            var outcomeClass = "badge-primary";

            if (!isNaN(homeScore) && !isNaN(awayScore)) {
              if (homeScore === awayScore) {
                outcome = "Draw";
                outcomeClass = "badge-warning";
              } else if ((homeScore > awayScore && broadHome) || (awayScore > homeScore && broadAway)) {
                outcome = "Win";
                outcomeClass = "badge-success";
              } else {
                outcome = "Loss";
                outcomeClass = "badge-primary";
              }
            }

            var venueType = broadHome ? "Home" : "Away";

            return (
              '<div class="card">' +
              '<div class="card-body flex items-center justify-between flex-wrap gap-4">' +
              '<div class="flex items-center gap-6">' +
              '<div class="text-center">' +
              '<div class="text-sm text-muted uppercase tracking-wider">' +
              esc(parts.weekday) +
              "</div>" +
              '<div class="text-2xl font-bold">' +
              esc(parts.day) +
              "</div>" +
              '<div class="text-sm text-muted">' +
              esc(parts.month) +
              "</div>" +
              "</div>" +
              "<div>" +
              '<span class="badge ' +
              outcomeClass +
              ' mb-2">' +
              outcome +
              "</span>" +
              '<h3 class="text-lg font-bold mb-1 fixture-score-line">' +
              renderTeamWithLogo(f.home_team, "fixture-team-inline") +
              '<span class="fixture-score-value">' +
              esc(f.home_score) +
              "</span>" +
              '<span class="fixture-score-sep">-</span>' +
              '<span class="fixture-score-value">' +
              esc(f.away_score) +
              "</span>" +
              renderTeamWithLogo(f.away_team, "fixture-team-inline") +
              "</h3>" +
              '<p class="text-sm text-muted">' +
              esc(f.competition || "") +
              (venueType ? " - " + venueType : "") +
              "</p>" +
              "</div>" +
              "</div>" +
              "</div>" +
              "</div>"
            );
          })
          .join("");
      }
    }
  }

  async function load() {
    try {
      var isHomepage = !!document.getElementById("homeNextMatch");
      var hasFixturesStandings = !!document.getElementById("fixturesStandings");
      var isFixturesPage =
        !!document.getElementById("fixturesList") || !!document.getElementById("resultsList") || hasFixturesStandings;
      var needsStandings = isHomepage || hasFixturesStandings;

      var promises = [SheetsAPI.fetchTab("fixtures")];
      if (needsStandings) promises.push(SheetsAPI.fetchTab("standings"));

      var results = await Promise.all(promises);
      var allFixtures = results[0] || [];
      var fixtures = allFixtures.filter(isBroadstreetFixture);
      var standings = needsStandings ? results[1] || [] : [];

      if (isHomepage) {
        var upcoming = sortFixturesByDate(
          fixtures.filter(function (f) {
            return getEffectiveStatus(f) === "upcoming";
          }),
          "asc"
        );
        if (upcoming.length) {
          renderNextMatch(upcoming[0]);
        } else {
          renderNoUpcomingNextMatch();
        }

        if (standings.length) renderHomeStandings(standings);

        var completed = sortFixturesByDate(
          fixtures.filter(function (f) {
            return getEffectiveStatus(f) === "completed" && hasScores(f);
          }),
          "desc"
        );
        var recent = completed.slice(0, 3);
        if (recent.length) renderHomeResults(recent);
      }

      if (isFixturesPage) {
        renderFixturesPage(fixtures);
        updateFixturesStandingsTitle(fixtures);
        if (hasFixturesStandings) renderFixturesStandings(standings);
      }
    } catch (e) {
      if (document.getElementById("homeNextMatch")) {
        renderNoUpcomingNextMatch();
      }

      var upcomingEl = document.getElementById("fixturesList");
      var resultsList = document.getElementById("resultsList");
      var standingsBody = document.getElementById("fixturesStandings");

      if (upcomingEl) {
        upcomingEl.innerHTML = '<div class="card"><div class="card-body"><p class="text-muted">Unable to load fixtures right now.</p></div></div>';
      }
      if (resultsList) {
        resultsList.innerHTML = '<div class="card"><div class="card-body"><p class="text-muted">Unable to load results right now.</p></div></div>';
      }
      if (standingsBody) {
        standingsBody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">Unable to load standings right now.</td></tr>';
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
