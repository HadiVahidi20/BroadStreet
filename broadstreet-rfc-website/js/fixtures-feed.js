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
    var d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

  function parseMatchDateTime(dateStr, timeStr) {
    try {
      var combined = String(dateStr || "") + " " + String(timeStr || "");
      var d = new Date(combined.trim());
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch (e) {
      // ignore parse errors
    }
    return null;
  }

  function toSortTime(dateStr, timeStr) {
    var iso = parseMatchDateTime(dateStr, timeStr);
    if (iso) return new Date(iso).getTime();

    var d = new Date(dateStr || "");
    if (!isNaN(d.getTime())) return d.getTime();
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
    var timeStr = fixture.time || "";
    if (details[0] && dateStr) details[0].textContent = dateStr;
    if (details[1] && timeStr) details[1].textContent = "Kick-off: " + timeStr;
    if (details[2] && fixture.venue) details[2].textContent = fixture.venue;

    if (countdown && dateStr && timeStr) {
      var isoDate = parseMatchDateTime(dateStr, timeStr);
      if (isoDate) countdown.setAttribute("data-countdown", isoDate);
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
        return String(f.status || "").toLowerCase() === "upcoming";
      }),
      "asc"
    );

    var completedItems = sortFixturesByDate(
      fixtures.filter(function (f) {
        return String(f.status || "").toLowerCase() === "completed";
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
              (f.time ? " - Kick-off " + esc(f.time) : "") +
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
            return String(f.status || "").toLowerCase() === "upcoming";
          }),
          "asc"
        );
        if (upcoming.length) renderNextMatch(upcoming[0]);

        if (standings.length) renderHomeStandings(standings);

        var completed = sortFixturesByDate(
          fixtures.filter(function (f) {
            return String(f.status || "").toLowerCase() === "completed";
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
