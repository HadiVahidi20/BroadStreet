/**
 * Teams page: render coaching staff and player cards from Google Sheets.
 * Depends on: site-config.js, sheets-api.js
 */

(function () {
  var esc = SheetsAPI.esc;

  var defaultPlayerImg = '../assets/photos/player_headshot/player_headshot.png';
  var defaultCoachImg = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&q=80&fit=crop';

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
      mainGrid.innerHTML = mainCoaches.map(function (c) {
        var img = esc(c.image || defaultCoachImg);
        var name = esc(c.name || 'TBC');
        var role = esc(c.role || '');
        var team = esc(c.team || '');
        return (
          '<div class="card text-center">' +
            '<img src="' + img + '" alt="' + name + '" style="width: 100%; aspect-ratio: 1; object-fit: cover;">' +
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
      otherGrid.innerHTML = otherCoaches.map(function (c) {
        var img = esc(c.image || defaultCoachImg);
        var name = esc(c.name || 'TBC');
        var role = esc(c.role || '');
        return (
          '<div class="card text-center">' +
            '<img src="' + img + '" alt="' + name + '" style="width: 100%; aspect-ratio: 1; object-fit: cover;">' +
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

    grid.innerHTML = players.map(function (p) {
      var name = esc(p.name || 'TBC');
      var pos = esc(p.position || '');
      var num = esc(p.number || '');
      var img = esc(p.image || defaultPlayerImg);
      var height = esc(p.height || '');
      var weight = esc(p.weight || '');
      var age = esc(p.age || '');
      var caps = esc(p.caps || '');

      // Build data-position attribute for filter
      var posLower = (p.position || '').toLowerCase();
      var positionClasses = posLower;
      // Add group class (forward/back)
      if (/prop|hooker|lock|flanker|number.?8/i.test(posLower)) {
        positionClasses += ' forward';
      } else if (/scrum|fly|centre|wing|fullback|half/i.test(posLower)) {
        positionClasses += ' back';
      }

      var statsLine = '';
      if (height || weight) {
        statsLine += '<div>';
        if (height) statsLine += 'Height: ' + height;
        if (height && weight) statsLine += ' &bull; ';
        if (weight) statsLine += 'Weight: ' + weight;
        statsLine += '</div>';
      }
      if (age || caps) {
        statsLine += '<div class="mt-1">';
        if (age) statsLine += 'Age: ' + age;
        if (age && caps) statsLine += ' &bull; ';
        if (caps) statsLine += 'Caps: ' + caps;
        statsLine += '</div>';
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
              '<div class="text-sm text-muted mb-1">' + num + (num && pos ? ' &bull; ' : '') + pos + '</div>' +
              '<h4 class="mb-2">' + name + '</h4>' +
              '<div class="text-xs text-muted">' + statsLine + '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

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
      var bg = cardElement.querySelector('.player-card-bg');
      var photo = cardElement.querySelector('.player-card-photo');

      cardElement.addEventListener('mousemove', function (e) {
        var rect = cardElement.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = (y - centerY) / 10;
        var rotateY = (centerX - x) / 10;

        cardElement.style.transform = 'perspective(1500px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02, 1.02, 1.02)';
        if (bg) {
          bg.style.transform = 'translate(' + ((x - centerX) / 30) + 'px, ' + ((y - centerY) / 30) + 'px) scale(1.1)';
        }
        if (photo) {
          photo.style.transform = 'translateX(calc(-50% + ' + ((centerX - x) / 20) + 'px)) translateY(' + ((centerY - y) / 20) + 'px) scale(1.05)';
        }
      });

      cardElement.addEventListener('mouseleave', function () {
        cardElement.style.transform = 'perspective(1500px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        if (bg) bg.style.transform = 'translate(0, 0) scale(1)';
        if (photo) photo.style.transform = 'translateX(-50%) translateY(0) scale(1)';
      });

      cardElement.addEventListener('mouseenter', function () {
        cardElement.style.transition = 'box-shadow 0.3s ease';
        if (bg) bg.style.transition = 'transform 0.1s ease-out';
        if (photo) photo.style.transition = 'transform 0.1s ease-out, filter 0.3s ease';
      });

      cardElement.addEventListener('mouseleave', function () {
        cardElement.style.transition = 'all 0.5s ease';
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
