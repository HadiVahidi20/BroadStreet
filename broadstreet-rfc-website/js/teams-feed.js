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

    addDetail('Team', ['team']);
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

  // ── Coaching Staff ──────────────────────────────────────────────────
  function renderCoaching(coaches) {
    var mainGrid = document.getElementById('coachingMain');
    var otherGrid = document.getElementById('coachingOther');
    if (!mainGrid && !otherGrid) return;
    if (!coaches.length) return;

    // First 3 coaches go into the main grid (larger cards)
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

  // ── Player Cards ────────────────────────────────────────────────────
  function renderPlayers(players) {
    var grid = document.getElementById('playerGrid');
    if (!grid || !players.length) return;

    grid.innerHTML = players.map(function (p, index) {
      var name = esc(getPlayerName(p));
      var pos = esc(getPlayerPosition(p));
      var img = esc(pickValue(p, ['image']) || defaultPlayerImg);

      // Build data-position attribute for filter
      var posLower = getPlayerPosition(p).toLowerCase();
      var positionClasses = posLower;
      // Add group class (forward/back)
      if (/prop|hooker|lock|flanker|number.?8|back row|second row/i.test(posLower)) {
        positionClasses += ' forward';
      } else if (/scrum|fly|centre|wing|full\s*back|half|center/i.test(posLower)) {
        positionClasses += ' back';
      }

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
    // Re-bind the position filter to new cards
    rebindFilter();
    // Re-bind 3D tilt effect
    rebindTiltEffect();
  }

  function rebindFilter() {
    var filterSelect = document.getElementById('positionFilter');
    var playerCards = document.querySelectorAll('.player-card');
    if (!filterSelect || !playerCards.length) return;

    // Reset filter to 'all'
    filterSelect.value = 'all';

    // Clone and replace to remove old listener
    var newSelect = filterSelect.cloneNode(true);
    filterSelect.parentNode.replaceChild(newSelect, filterSelect);

    newSelect.addEventListener('change', function () {
      var selected = this.value;
      var cards = document.querySelectorAll('.player-card');
      cards.forEach(function (card) {
        var positions = card.getAttribute('data-position') || '';
        if (selected === 'all' || positions.indexOf(selected) !== -1) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
      // Fade-in animation
      setTimeout(function () {
        document.querySelectorAll('.player-card:not(.hidden)').forEach(function (card, index) {
          card.style.animation = 'none';
          setTimeout(function () {
            card.style.animation = 'fadeIn 0.4s ease ' + (index * 0.05) + 's forwards';
          }, 10);
        });
      }, 10);
    });
  }

  function rebindTiltEffect() {
    var cards = document.querySelectorAll('.player-card .card');
    cards.forEach(function (cardElement) {
      var imageLayer = cardElement.querySelector('.player-card-image');
      var bg = cardElement.querySelector('.player-card-bg');
      var photo = cardElement.querySelector('.player-card-photo');
      if (!imageLayer) return;

      cardElement.addEventListener('mousemove', function (e) {
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

      cardElement.addEventListener('mouseleave', function () {
        imageLayer.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        if (bg) bg.style.transform = 'translate(0, 0) scale(1)';
        if (photo) photo.style.transform = 'translateX(-50%) translateY(0) scale(1)';
      });

      cardElement.addEventListener('mouseenter', function () {
        imageLayer.style.transition = 'transform 0.1s ease-out';
        if (bg) bg.style.transition = 'transform 0.1s ease-out';
        if (photo) photo.style.transition = 'transform 0.1s ease-out, filter 0.3s ease';
      });

      cardElement.addEventListener('mouseleave', function () {
        imageLayer.style.transition = 'transform 0.5s ease';
        if (bg) bg.style.transition = 'transform 0.5s ease';
        if (photo) photo.style.transition = 'transform 0.5s ease, filter 0.3s ease';
      });
    });
  }

  // ── Load ─────────────────────────────────────────────────────────────
  async function load() {
    try {
      var results = await Promise.all([
        SheetsAPI.fetchTab('coaching'),
        SheetsAPI.fetchTab('players'),
      ]);

      var coaches = results[0] || [];
      var players = results[1] || [];

      if (coaches.length) renderCoaching(coaches);

      // Filter to 1st XV players for the main page grid
      var firstXV = players.filter(function (p) {
        return !p.team || p.team === '1st XV';
      });
      if (firstXV.length) renderPlayers(firstXV);
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
