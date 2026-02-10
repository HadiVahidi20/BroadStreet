/**
 * Teams page: render coaching staff and player cards from Google Sheets.
 * Depends on: site-config.js, sheets-api.js
 */

(function () {
  var esc = SheetsAPI.esc;

  var defaultPlayerImg = '../assets/photos/player_headshot/player_headshot.png';
  var defaultCoachImgs = [
    'https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698b5e630708e4126801c291.png',
    'https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698b5e63ca717c948eb9a788.png',
    'https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698b5e630708e4742101c292.png',
    'https://storage.googleapis.com/msgsndr/su6QlYYHk7V0zo5SCC0s/media/698b5e63a41b876ab95644a5.png'
  ];

  var playerModal = null;
  var playerModalEscBound = false;

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function pickValue(row, keys) {
    if (!row) return '';
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = clean(row[key]);
      if (value) return value;
    }
    return '';
  }

  function getPlayerName(player) {
    var firstName = pickValue(player, ['first_name']);
    var surname = pickValue(player, ['surname']);
    if (firstName || surname) {
      return (firstName + ' ' + surname).trim();
    }
    return pickValue(player, ['name']) || 'TBC';
  }

  function getPlayerPosition(player) {
    return pickValue(player, ['position', 'position_or_role']);
  }

  function getCoachImage(coach, index) {
    var image = pickValue(coach, ['image']);
    if (image) return image;
    return defaultCoachImgs[index % defaultCoachImgs.length];
  }

  function ensurePlayerModal() {
    if (playerModal && document.body.contains(playerModal)) {
      return playerModal;
    }

    playerModal = document.getElementById('playerProfileModal');
    if (!playerModal) {
      playerModal = document.createElement('div');
      playerModal.id = 'playerProfileModal';
      playerModal.className = 'player-profile-modal';
      playerModal.setAttribute('aria-hidden', 'true');
      playerModal.innerHTML =
        '<div class="player-profile-backdrop" data-player-close="true"></div>' +
        '<div class="player-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="playerProfileTitle">' +
          '<button type="button" class="player-profile-close" aria-label="Close profile" data-player-close="true">&times;</button>' +
          '<div class="player-profile-content" id="playerProfileContent"></div>' +
        '</div>';
      document.body.appendChild(playerModal);
    }

    playerModal.onclick = function (evt) {
      var target = evt.target;
      if (!target) return;
      if (target.getAttribute('data-player-close') === 'true') {
        closePlayerModal();
      }
    };

    if (!playerModalEscBound) {
      document.addEventListener('keydown', function (evt) {
        if (evt.key === 'Escape') {
          closePlayerModal();
        }
      });
      playerModalEscBound = true;
    }

    return playerModal;
  }

  function buildPlayerModalHtml(player) {
    var name = getPlayerName(player);
    var position = getPlayerPosition(player);
    var nickname = pickValue(player, ['nickname']);
    var image = pickValue(player, ['image']) || defaultPlayerImg;
    var details = [];

    function addDetail(label, keys) {
      var value = pickValue(player, keys);
      if (!value) return;
      details.push({ label: label, value: value });
    }

    addDetail('Team', ['team', 'team_name', 'squad']);
    addDetail('Jersey Number', ['number']);
    addDetail('Position Category', ['position_category']);
    addDetail('Date of Birth', ['date_of_birth']);
    addDetail('Age', ['age']);
    addDetail('Birthplace', ['birthplace']);
    addDetail('Height', ['height', 'height_cm']);
    addDetail('Weight', ['weight']);
    addDetail('Caps', ['caps']);
    addDetail('Sponsor', ['sponsor', 'who_is_your_sponsor']);
    addDetail('Previous Club 1', ['previous_club_1']);
    addDetail('Previous Club 2', ['previous_club_2']);
    addDetail('Coach Age Group', ['coach_age_group']);
    addDetail('Seasons at Broadstreet', ['seasons_at_broadstreet']);

    var detailsHtml = details.map(function (item) {
      return (
        '<div class="player-profile-item">' +
          '<div class="player-profile-label">' + esc(item.label) + '</div>' +
          '<div class="player-profile-value">' + esc(item.value) + '</div>' +
        '</div>'
      );
    }).join('');

    if (!detailsHtml) {
      detailsHtml = '<p class="text-muted mb-0">No additional profile details available.</p>';
    }

    return (
      '<div class="player-profile-header">' +
        '<img src="' + esc(image) + '" alt="' + esc(name) + '" class="player-profile-photo">' +
        '<div>' +
          (position ? '<div class="player-profile-position">' + esc(position) + '</div>' : '') +
          '<h3 id="playerProfileTitle" class="player-profile-name">' + esc(name) + '</h3>' +
          (nickname ? '<p class="player-profile-nickname">Nickname: ' + esc(nickname) + '</p>' : '') +
        '</div>' +
      '</div>' +
      '<div class="player-profile-grid">' + detailsHtml + '</div>'
    );
  }

  function openPlayerModal(player) {
    if (!player) return;
    var modal = ensurePlayerModal();
    var content = modal.querySelector('#playerProfileContent');
    if (!content) return;

    content.innerHTML = buildPlayerModalHtml(player);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('player-modal-open');
  }

  function closePlayerModal() {
    if (!playerModal) return;
    playerModal.classList.remove('is-open');
    playerModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('player-modal-open');
  }

  function bindProfileButtons(grid, players) {
    if (!grid) return;
    grid.onclick = function (event) {
      var target = event.target;
      if (!target) return;

      var button = target.closest('.player-profile-btn');
      if (!button) return;

      var index = parseInt(button.getAttribute('data-player-index'), 10);
      if (isNaN(index) || !players[index]) return;
      openPlayerModal(players[index]);
    };
  }

  // Coaching Staff
  function renderCoaching(coaches) {
    var mainGrid = document.getElementById('coachingMain');
    var otherGrid = document.getElementById('coachingOther');
    if (!mainGrid && !otherGrid) return;
    if (!coaches.length) return;

    var mainCoaches = coaches.slice(0, 3);
    var otherCoaches = coaches.slice(3);

    if (mainGrid && mainCoaches.length) {
      mainGrid.innerHTML = mainCoaches.map(function (c, index) {
        var img = esc(getCoachImage(c, index));
        var name = esc(c.name || 'TBC');
        var role = esc(c.role || '');
        var team = esc(c.team || '');
        return (
          '<div class="card text-center">' +
            '<img src="' + img + '" alt="' + name + '" class="coach-card-image coach-card-image-main">' +
            '<div class="card-body">' +
              '<span class="badge badge-primary mb-2">' + role + '</span>' +
              '<h3>' + name + '</h3>' +
              (team ? '<p class="text-muted mb-2">' + team + '</p>' : '') +
            '</div>' +
          '</div>'
        );
      }).join('');
    }

    if (otherGrid && otherCoaches.length) {
      otherGrid.innerHTML = otherCoaches.map(function (c, index) {
        var img = esc(getCoachImage(c, index + 3));
        var name = esc(c.name || 'TBC');
        var role = esc(c.role || '');
        return (
          '<div class="card text-center">' +
            '<img src="' + img + '" alt="' + name + '" class="coach-card-image coach-card-image-compact">' +
            '<div class="card-body">' +
              '<h4 class="text-base">' + name + '</h4>' +
              '<p class="text-xs text-muted">' + role + '</p>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }
  }

  // Player Cards
  function buildPositionClasses(player) {
    var posLower = getPlayerPosition(player).toLowerCase();
    var compact = posLower.replace(/[^a-z0-9]+/g, '');
    var classes = posLower;

    if (compact && compact !== posLower) {
      classes += ' ' + compact;
    }

    if (/number\s*8|no\.?\s*8/.test(posLower)) {
      classes += ' number8';
    }
    if (/scrum\s*half/.test(posLower)) {
      classes += ' scrumhalf';
    }
    if (/fly\s*half/.test(posLower)) {
      classes += ' flyhalf';
    }
    if (/full\s*back/.test(posLower)) {
      classes += ' fullback';
    }
    if (/centre/.test(posLower)) {
      classes += ' center';
    }
    if (/center/.test(posLower)) {
      classes += ' centre';
    }

    if (/prop|hooker|lock|flanker|number.?8|back row|second row/i.test(posLower)) {
      classes += ' forward';
    } else if (/scrum|fly|centre|wing|full\s*back|half|center/i.test(posLower)) {
      classes += ' back';
    }

    return classes;
  }

  function renderPlayers(players, gridOrId) {
    var grid = typeof gridOrId === 'string' ? document.getElementById(gridOrId) : gridOrId;
    if (!grid) return false;

    if (!players || !players.length) {
      grid.innerHTML = '';
      grid.onclick = null;
      return false;
    }

    grid.innerHTML = players.map(function (p, index) {
      var name = esc(getPlayerName(p));
      var pos = esc(getPlayerPosition(p));
      var img = esc(pickValue(p, ['image']) || defaultPlayerImg);
      var positionClasses = buildPositionClasses(p);

      return (
        '<div class="player-card" data-position="' + esc(positionClasses) + '">' +
          '<div class="card">' +
            '<div class="player-card-image">' +
              '<div class="player-card-bg"></div>' +
              '<img src="' + img + '" alt="' + name + '" class="player-card-photo">' +
              '<div class="player-card-overlay"></div>' +
            '</div>' +
            '<div class="card-body text-center">' +
              (pos ? '<div class="text-sm text-muted mb-1">' + pos + '</div>' : '') +
              '<h4 class="mb-3">' + name + '</h4>' +
              '<button type="button" class="btn btn-outline btn-sm player-profile-btn" data-player-index="' + index + '">View Full Profile</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    bindProfileButtons(grid, players);
    return true;
  }

  function setSectionVisible(sectionId, visible) {
    var section = document.getElementById(sectionId);
    if (!section) return;
    section.style.display = visible ? '' : 'none';
  }

  function normalizeTeamKey(teamName) {
    return clean(teamName)
      .toLowerCase()
      .replace(/['\u2019]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function hasAnyHint(text, hints) {
    for (var i = 0; i < hints.length; i++) {
      if (text.indexOf(hints[i]) !== -1) return true;
    }
    return false;
  }

  function hasAgeInRange(teamKey, minAge, maxAge) {
    if (!teamKey) return false;
    var re = /(?:^|\s)(?:u|under)\s*([0-9]{1,2})s?(?=\s|$)/g;
    var match = re.exec(teamKey);
    while (match) {
      var age = parseInt(match[1], 10);
      if (!isNaN(age) && age >= minAge && age <= maxAge) {
        return true;
      }
      match = re.exec(teamKey);
    }
    return false;
  }

  function classifyTeamBucket(teamName) {
    var teamKey = normalizeTeamKey(teamName);
    if (!teamKey) return 'first';

    if (hasAnyHint(teamKey, ['touch'])) return 'touch';

    if (hasAnyHint(teamKey, ['mini', 'minis']) || hasAgeInRange(teamKey, 5, 12)) {
      return 'minis';
    }

    if (
      hasAnyHint(teamKey, ['youth', 'junior', 'juniors', 'colts', 'academy', 'girls', 'boys']) ||
      hasAgeInRange(teamKey, 13, 18)
    ) {
      return 'youth';
    }

    if (hasAnyHint(teamKey, ['women', 'womens', 'ladies', 'female'])) {
      return 'women';
    }

    if (
      /(?:^|\s)(?:2|2nd|second)\s*xv(?=\s|$)/.test(teamKey) ||
      hasAnyHint(teamKey, ['2nd', 'second', 'seconds', 'development', 'dev squad', 'dev'])
    ) {
      return 'second';
    }

    if (
      /(?:^|\s)(?:1|1st|first)\s*xv(?=\s|$)/.test(teamKey) ||
      hasAnyHint(teamKey, ['1st', 'first', 'firsts', 'senior'])
    ) {
      return 'first';
    }

    return 'other';
  }

  function groupPlayersByTeam(players) {
    var grouped = {
      first: [],
      second: [],
      women: [],
      youth: [],
      minis: [],
      touch: [],
      other: {},
    };

    for (var i = 0; i < players.length; i++) {
      var player = players[i];
      var teamName = pickValue(player, ['team', 'team_name', 'squad']);
      var bucket = classifyTeamBucket(teamName);

      if (bucket === 'other') {
        var otherKey = normalizeTeamKey(teamName) || 'other-team';
        if (!grouped.other[otherKey]) {
          grouped.other[otherKey] = {
            label: teamName || 'Other Team',
            players: [],
          };
        }
        grouped.other[otherKey].players.push(player);
      } else {
        grouped[bucket].push(player);
      }
    }

    return grouped;
  }

  function renderOptionalRoster(sectionId, gridId, players) {
    var hasPlayers = renderPlayers(players, gridId);
    setSectionVisible(sectionId, hasPlayers);
  }

  function renderOtherTeamRosters(otherTeams) {
    var section = document.getElementById('otherTeamsSection');
    var container = document.getElementById('otherTeamsDynamic');
    if (!section || !container) return;

    var keys = Object.keys(otherTeams || {});
    if (!keys.length) {
      container.innerHTML = '';
      section.style.display = 'none';
      return;
    }

    keys.sort(function (a, b) {
      return otherTeams[a].label.localeCompare(otherTeams[b].label);
    });

    container.innerHTML = keys.map(function (key, index) {
      var team = otherTeams[key];
      return (
        '<div class="dynamic-team-roster">' +
          '<h3 class="dynamic-team-roster-title">' + esc(team.label) + ' Squad Profiles</h3>' +
          '<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" id="otherTeamPlayerGrid-' + index + '"></div>' +
        '</div>'
      );
    }).join('');

    for (var i = 0; i < keys.length; i++) {
      renderPlayers(otherTeams[keys[i]].players, 'otherTeamPlayerGrid-' + i);
    }

    section.style.display = '';
  }

  function renderTeamRosters(players) {
    var grouped = groupPlayersByTeam(players);
    var firstGrid = document.getElementById('playerGrid');

    if (firstGrid) {
      if (grouped.first.length) {
        renderPlayers(grouped.first, firstGrid);
      } else {
        firstGrid.innerHTML =
          '<div class="card">' +
            '<div class="card-body text-center">' +
              '<p class="text-muted mb-0">First XV squad profiles will appear here soon.</p>' +
            '</div>' +
          '</div>';
        firstGrid.onclick = null;
      }
    }

    renderOptionalRoster('secondXVRosterSection', 'secondXVPlayerGrid', grouped.second);
    renderOptionalRoster('womenRosterSection', 'womenPlayerGrid', grouped.women);
    renderOptionalRoster('youthRosterSection', 'youthPlayerGrid', grouped.youth);
    renderOptionalRoster('minisRosterSection', 'minisPlayerGrid', grouped.minis);
    renderOptionalRoster('touchRosterSection', 'touchPlayerGrid', grouped.touch);
    renderOtherTeamRosters(grouped.other);
  }

  function bindFirstTeamFilter() {
    var filterSelect = document.getElementById('positionFilter');
    var firstGrid = document.getElementById('playerGrid');
    if (!filterSelect || !firstGrid) return;

    var newSelect = filterSelect.cloneNode(true);
    if (filterSelect.parentNode) {
      filterSelect.parentNode.replaceChild(newSelect, filterSelect);
    }

    function applyFilter() {
      var selected = newSelect.value;
      var cards = firstGrid.querySelectorAll('.player-card');

      for (var i = 0; i < cards.length; i++) {
        var positions = cards[i].getAttribute('data-position') || '';
        if (selected === 'all' || positions.indexOf(selected) !== -1) {
          cards[i].classList.remove('hidden');
        } else {
          cards[i].classList.add('hidden');
        }
      }

      setTimeout(function () {
        var visible = firstGrid.querySelectorAll('.player-card:not(.hidden)');
        for (var j = 0; j < visible.length; j++) {
          visible[j].style.animation = 'none';
          (function (card, index) {
            setTimeout(function () {
              card.style.animation = 'fadeIn 0.4s ease ' + (index * 0.05) + 's forwards';
            }, 10);
          })(visible[j], j);
        }
      }, 10);
    }

    newSelect.value = 'all';
    newSelect.disabled = firstGrid.querySelectorAll('.player-card').length === 0;
    newSelect.addEventListener('change', applyFilter);
    applyFilter();
  }

  function bindTiltEffect() {
    var cards = document.querySelectorAll('.player-card .card');
    for (var i = 0; i < cards.length; i++) {
      var cardElement = cards[i];
      if (cardElement.getAttribute('data-tilt-bound') === 'true') continue;
      cardElement.setAttribute('data-tilt-bound', 'true');

      (function (cardNode) {
        var imageLayer = cardNode.querySelector('.player-card-image');
        var bg = cardNode.querySelector('.player-card-bg');
        var photo = cardNode.querySelector('.player-card-photo');
        if (!imageLayer) return;

        cardNode.addEventListener('mousemove', function (e) {
          var rect = imageLayer.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          var centerX = rect.width / 2;
          var centerY = rect.height / 2;
          var rotateX = (y - centerY) / 16;
          var rotateY = (centerX - x) / 16;

          imageLayer.style.transform = 'perspective(1200px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.01, 1.01, 1.01)';
          if (bg) {
            bg.style.transform = 'translate(' + ((x - centerX) / 32) + 'px, ' + ((y - centerY) / 32) + 'px) scale(1.08)';
          }
          if (photo) {
            photo.style.transform = 'translateX(calc(-50% + ' + ((centerX - x) / 20) + 'px)) translateY(' + ((centerY - y) / 20) + 'px) scale(1.05)';
          }
        });

        cardNode.addEventListener('mouseleave', function () {
          imageLayer.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
          if (bg) bg.style.transform = 'translate(0, 0) scale(1)';
          if (photo) photo.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        });

        cardNode.addEventListener('mouseenter', function () {
          imageLayer.style.transition = 'transform 0.1s ease-out';
          if (bg) bg.style.transition = 'transform 0.1s ease-out';
          if (photo) photo.style.transition = 'transform 0.1s ease-out, filter 0.3s ease';
        });

        cardNode.addEventListener('mouseleave', function () {
          imageLayer.style.transition = 'transform 0.5s ease';
          if (bg) bg.style.transition = 'transform 0.5s ease';
          if (photo) photo.style.transition = 'transform 0.5s ease, filter 0.3s ease';
        });
      })(cardElement);
    }
  }

  // Load
  async function load() {
    bindFirstTeamFilter();
    bindTiltEffect();

    try {
      var results = await Promise.all([
        SheetsAPI.fetchTab('coaching'),
        SheetsAPI.fetchTab('players'),
      ]);

      var coaches = results[0] || [];
      var players = results[1] || [];

      if (coaches.length) renderCoaching(coaches);
      if (!players.length) return;

      renderTeamRosters(players);
      bindFirstTeamFilter();
      bindTiltEffect();
    } catch (e) {
      // Keep hardcoded placeholders on error
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
