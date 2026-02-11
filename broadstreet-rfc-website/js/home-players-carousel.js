/**
 * Home page players carousel feed from Google Sheets.
 * Depends on: site-config.js, sheets-api.js
 */

(function () {
  if (typeof SheetsAPI === "undefined") return;

  var esc = SheetsAPI.esc;
  var defaultPlayerImg = resolveAssetPath_("assets/photos/player_headshot/player_headshot.png");
  var resizeBound = false;
  var marqueeTrack = null;
  var marqueeRaf = 0;
  var marqueeLastTs = 0;
  var marqueeOffset = 0;
  var marqueeDistance = 0;
  var marqueePaused = false;
  var marqueeSpeedPxPerSecond = 72;

  function resolveAssetPath_(path) {
    var pathname = String((window && window.location && window.location.pathname) || "");
    return pathname.indexOf("/pages/") !== -1 ? "../" + path : path;
  }

  function pickValue(row, keys) {
    if (!row) return "";
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
      var value = row[key];
      if (value === null || value === undefined) continue;
      var trimmed = String(value).trim();
      if (trimmed !== "") return trimmed;
    }
    return "";
  }

  function normalizeTeamKey(teamName) {
    return String(teamName || "")
      .toLowerCase()
      .replace(/['\u2019]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function getPlayerName(player) {
    var firstName = pickValue(player, ["first_name"]);
    var surname = pickValue(player, ["surname"]);
    var fullName = (firstName + " " + surname).trim();
    return fullName || pickValue(player, ["name"]) || "TBC";
  }

  function getPlayerPosition(player) {
    return pickValue(player, ["position", "position_category", "position_or_role"]) || "Player";
  }

  function getPlayerTeam(player) {
    return pickValue(player, ["team", "team_name", "squad"]) || "Broadstreet RFC";
  }

  function getTeamPriority(player) {
    var teamKey = normalizeTeamKey(getPlayerTeam(player));
    if (!teamKey) return 2;

    var isSecond = /(^|\s)(2|2nd|second)\s*xv($|\s)/.test(teamKey) || teamKey.indexOf("development") !== -1;
    var isFirst = /(^|\s)(1|1st|first)\s*xv($|\s)/.test(teamKey) || teamKey.indexOf("senior") !== -1;
    var isWomen = teamKey.indexOf("women") !== -1 || teamKey.indexOf("ladies") !== -1;
    var isYouth = teamKey.indexOf("youth") !== -1 || teamKey.indexOf("junior") !== -1 || teamKey.indexOf("mini") !== -1;
    var isTouch = teamKey.indexOf("touch") !== -1;

    if (isFirst && !isSecond) return 0;
    if (isWomen) return 1;
    if (isSecond) return 2;
    if (isYouth || isTouch) return 3;
    return 4;
  }

  function sortPlayers(players) {
    return (players || []).slice().sort(function (a, b) {
      var priorityDiff = getTeamPriority(a) - getTeamPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      return getPlayerName(a).localeCompare(getPlayerName(b));
    });
  }

  function buildPlayerCardHtml(player) {
    var name = esc(getPlayerName(player));
    var position = esc(getPlayerPosition(player));
    var team = esc(getPlayerTeam(player));
    var image = esc(pickValue(player, ["image"]) || defaultPlayerImg);

    return (
      '<article class="home-player-card">' +
      '<div class="home-player-card-image">' +
      '<div class="home-player-card-bg"></div>' +
      '<img src="' +
      image +
      '" alt="' +
      name +
      '" class="home-player-card-photo" loading="lazy">' +
      "</div>" +
      '<div class="home-player-card-body">' +
      '<p class="home-player-position">' +
      position +
      "</p>" +
      '<h3 class="home-player-name">' +
      name +
      "</h3>" +
      '<p class="home-player-team">' +
      team +
      "</p>" +
      "</div>" +
      "</article>"
    );
  }

  function measureLoopDistance(track, baseCount) {
    if (!track || !baseCount) return;

    var cards = track.querySelectorAll(".home-player-card");
    if (!cards.length) return 0;

    var firstCard = cards[0];
    var splitCard = cards[baseCount];
    if (!firstCard || !splitCard) return 0;

    var firstRect = firstCard.getBoundingClientRect();
    var splitRect = splitCard.getBoundingClientRect();
    var distance = splitRect.left - firstRect.left;
    if (!distance || !isFinite(distance)) return 0;
    return Math.max(1, distance);
  }

  function stopMarquee() {
    if (marqueeRaf) {
      cancelAnimationFrame(marqueeRaf);
      marqueeRaf = 0;
    }
    marqueeLastTs = 0;
  }

  function renderMarqueeFrame(ts) {
    if (!marqueeTrack) return;

    if (!marqueeLastTs) {
      marqueeLastTs = ts;
    }

    var dt = (ts - marqueeLastTs) / 1000;
    marqueeLastTs = ts;

    if (!marqueePaused && marqueeDistance > 0) {
      marqueeOffset += marqueeSpeedPxPerSecond * dt;
      while (marqueeOffset >= marqueeDistance) {
        marqueeOffset -= marqueeDistance;
      }
      marqueeTrack.style.transform = "translate3d(" + (-marqueeOffset) + "px,0,0)";
    }

    marqueeRaf = requestAnimationFrame(renderMarqueeFrame);
  }

  function setMarqueePaused(paused) {
    marqueePaused = !!paused;
    if (!marqueePaused) {
      marqueeLastTs = 0;
    }
  }

  function bindMarqueeInteractions(track) {
    var carousel = document.getElementById("homePlayersCarousel");
    if (!carousel || track.getAttribute("data-marquee-bound") === "1") return;

    carousel.addEventListener("mouseenter", function () {
      setMarqueePaused(true);
    });
    carousel.addEventListener("mouseleave", function () {
      setMarqueePaused(false);
    });
    carousel.addEventListener("focusin", function () {
      setMarqueePaused(true);
    });
    carousel.addEventListener("focusout", function () {
      setMarqueePaused(false);
    });
    carousel.addEventListener("touchstart", function () {
      setMarqueePaused(true);
    }, { passive: true });
    carousel.addEventListener("touchend", function () {
      setMarqueePaused(false);
    }, { passive: true });

    track.setAttribute("data-marquee-bound", "1");
  }

  function startMarquee(track, baseCount) {
    stopMarquee();
    marqueeTrack = track;
    marqueeDistance = measureLoopDistance(track, baseCount);
    marqueeOffset = 0;
    marqueePaused = false;
    track.style.transform = "translate3d(0,0,0)";
    if (marqueeDistance > 0) {
      marqueeRaf = requestAnimationFrame(renderMarqueeFrame);
    }
  }

  function enableContinuousMarquee(track, baseCount) {
    if (!track || !baseCount) return;

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.classList.remove("is-marquee", "is-static");

    if (reduceMotion) {
      stopMarquee();
      marqueeTrack = null;
      track.classList.add("is-static");
      return;
    }

    track.classList.add("is-marquee");
    bindMarqueeInteractions(track);

    requestAnimationFrame(function () {
      startMarquee(track, baseCount);
    });

    if (!resizeBound) {
      window.addEventListener("resize", function () {
        var homeTrack = document.getElementById("homePlayersTrack");
        var count = parseInt((homeTrack && homeTrack.getAttribute("data-base-count")) || "0", 10);
        if (!homeTrack || !count) return;
        if (homeTrack !== marqueeTrack) return;

        var nextDistance = measureLoopDistance(homeTrack, count);
        if (!nextDistance) return;

        marqueeDistance = nextDistance;
        if (marqueeOffset >= marqueeDistance) {
          marqueeOffset = marqueeOffset % marqueeDistance;
        }
        homeTrack.style.transform = "translate3d(" + (-marqueeOffset) + "px,0,0)";
      });
      resizeBound = true;
    }
  }

  function renderPlayers(players) {
    var track = document.getElementById("homePlayersTrack");
    if (!track) return false;

    if (!players || !players.length) {
      track.innerHTML = '<div class="home-players-empty">Player profiles will appear here soon.</div>';
      track.classList.remove("is-marquee");
      track.classList.add("is-static");
      track.style.transform = "";
      track.removeAttribute("data-base-count");
      stopMarquee();
      marqueeTrack = null;
      return false;
    }

    var primaryHtml = players.map(buildPlayerCardHtml).join("");
    track.innerHTML = primaryHtml + primaryHtml;
    track.setAttribute("data-base-count", String(players.length));
    enableContinuousMarquee(track, players.length);
    return true;
  }

  async function load() {
    var host = document.getElementById("homePlayersTrack");
    if (!host) return;

    try {
      var players = await SheetsAPI.fetchTab("players");
      var sorted = sortPlayers(players || []);
      var selected = sorted.slice(0, 16);
      renderPlayers(selected);
    } catch (err) {
      renderPlayers([]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
