/**
 * Fixtures, Results & Standings feed from Google Sheets.
 * Populates: homepage next-match card, standings table, recent results.
 * Also populates fixtures.html if present.
 * Depends on: site-config.js, sheets-api.js
 */

(function () {
  var esc = SheetsAPI.esc;
  var parseBool = SheetsAPI.parseBool;

  function isBroadstreet(teamName) {
    return String(teamName || "").toLowerCase().indexOf("broadstreet") !== -1;
  }

  function getDateParts(dateStr) {
    var d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return {
        weekday: dayNames[d.getDay()],
        day: String(d.getDate()),
        month: monthNames[d.getMonth()],
      };
    }

    var match = String(dateStr || "").match(/^([A-Za-z]+)\s+(\d{1,2})\s+([A-Za-z]{3,})/);
    if (match) {
      return {
        weekday: match[1].slice(0, 3),
        day: match[2],
        month: match[3].slice(0, 3),
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

  // Homepage next match card
  function renderNextMatch(fixture) {
    var el = document.getElementById("homeNextMatch");
    if (!el || !fixture) return;

    var awayName = el.querySelector(".next-match-team:last-child .next-match-team-name");
    var competition = el.querySelector(".next-match-competition");
    var details = el.querySelectorAll(".next-match-detail-item span");
    var countdown = el.querySelector("[data-countdown]");

    if (awayName) awayName.textContent = fixture.away_team || "TBC";
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
      var isHome =
        String(fixture.venue || "").toLowerCase().indexOf("broadstreet") !== -1 ||
        String(fixture.home_team || "").toLowerCase().indexOf("broadstreet") !== -1;
      var badgeSpan = badge.querySelector("span") || badge.childNodes[badge.childNodes.length - 1];
      if (badgeSpan && badgeSpan.nodeType === 3) {
        badgeSpan.textContent = isHome ? "Home Match" : "Away Match";
      }
    }
  }

  // Homepage league standings
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
          esc(row.team) +
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

  // Homepage recent results
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
          "<span>" +
          esc(r.home_team) +
          "</span>" +
          "</div>" +
          "</div>" +
          '<div class="result-final" aria-hidden="true"><span></span></div>' +
          '<div class="result-score result-score-bottom">' +
          '<div class="result-number">' +
          esc(r.away_score) +
          "</div>" +
          '<div class="result-team">' +
          "<span>" +
          esc(r.away_team) +
          "</span>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  // Fixtures page standings table
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
          esc(row.team) +
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

  // Fixtures page cards
  function renderFixturesPage(fixtures) {
    var upcoming = document.getElementById("fixturesList");
    var resultsList = document.getElementById("resultsList");
    if (!upcoming && !resultsList) return;

    var upcomingItems = fixtures
      .filter(function (f) {
        return String(f.status || "").toLowerCase() === "upcoming";
      })
      .sort(function (a, b) {
        return toSortTime(a.date, a.time) - toSortTime(b.date, b.time);
      });

    var completedItems = fixtures
      .filter(function (f) {
        return String(f.status || "").toLowerCase() === "completed";
      })
      .sort(function (a, b) {
        return toSortTime(b.date, b.time) - toSortTime(a.date, a.time);
      });

    if (upcoming) {
      if (!upcomingItems.length) {
        upcoming.innerHTML = '<div class="card"><div class="card-body"><p class="text-muted">No upcoming fixtures found.</p></div></div>';
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
              '<h3 class="text-lg font-bold mb-1">' +
              esc(f.home_team) +
              " vs " +
              esc(f.away_team) +
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
        resultsList.innerHTML = '<div class="card"><div class="card-body"><p class="text-muted">No completed results found.</p></div></div>';
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
              } else if (broadHome || broadAway) {
                outcome = "Loss";
                outcomeClass = "badge-primary";
              }
            }

            var venueType = broadHome ? "Home" : broadAway ? "Away" : "";

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
              '<h3 class="text-lg font-bold mb-1">' +
              esc(f.home_team) +
              " " +
              esc(f.home_score) +
              " - " +
              esc(f.away_score) +
              " " +
              esc(f.away_team) +
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

  // Load all relevant blocks on page
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
      var fixtures = results[0] || [];
      var standings = needsStandings ? results[1] || [] : [];

      if (isHomepage) {
        var upcoming = fixtures.filter(function (f) {
          return String(f.status || "").toLowerCase() === "upcoming";
        });
        if (upcoming.length) renderNextMatch(upcoming[0]);

        if (standings.length) renderHomeStandings(standings);

        var completed = fixtures.filter(function (f) {
          return String(f.status || "").toLowerCase() === "completed";
        });
        var recent = completed.slice(-3).reverse();
        if (recent.length) renderHomeResults(recent);
      }

      if (isFixturesPage) {
        renderFixturesPage(fixtures);
        updateFixturesStandingsTitle(fixtures);
        if (hasFixturesStandings) renderFixturesStandings(standings);
      }
    } catch (e) {
      var upcoming = document.getElementById("fixturesList");
      var resultsList = document.getElementById("resultsList");
      var standingsBody = document.getElementById("fixturesStandings");

      if (upcoming) {
        upcoming.innerHTML = '<div class="card"><div class="card-body"><p class="text-muted">Unable to load fixtures right now.</p></div></div>';
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
