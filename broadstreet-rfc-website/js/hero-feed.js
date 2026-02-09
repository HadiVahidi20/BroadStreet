/**
 * Hero carousel feed from Google Sheets.
 * Updates existing hero slides with dynamic content.
 * Depends on: site-config.js, sheets-api.js
 *
 * Sheet columns: title, subtitle, image, cta_text, cta_link, cta2_text, cta2_link
 */

(function () {
  function updateSlide(slide, data) {
    if (!slide || !data) return;

    // Update background image
    var bg = slide.querySelector('.hero-bg');
    if (bg && data.image) {
      bg.style.backgroundImage = "url('" + data.image + "')";
    }

    // Update title (supports <br> by using innerHTML with escaped text + br)
    var title = slide.querySelector('.hero-title');
    if (title && data.title) {
      // Allow line breaks via \n or | in sheet
      title.innerHTML = SheetsAPI.esc(data.title).replace(/\|/g, '<br>').replace(/\\n/g, '<br>');
    }

    // Update subtitle
    var subtitle = slide.querySelector('.hero-subtitle');
    if (subtitle && data.subtitle) {
      subtitle.textContent = data.subtitle;
    }

    // Update CTAs
    var ctas = slide.querySelectorAll('.hero-cta a');
    if (ctas[0]) {
      if (data.cta_text) ctas[0].textContent = data.cta_text;
      if (data.cta_link) ctas[0].href = data.cta_link;
    }
    if (ctas[1]) {
      if (data.cta2_text) ctas[1].textContent = data.cta2_text;
      if (data.cta2_link) ctas[1].href = data.cta2_link;
    }
  }

  async function load() {
    try {
      var rows = await SheetsAPI.fetchTab('hero');
      if (!rows.length) return;

      var slides = document.querySelectorAll('.hero-slide');
      if (!slides.length) return;

      // Update existing slides with sheet data
      for (var i = 0; i < Math.min(rows.length, slides.length); i++) {
        updateSlide(slides[i], rows[i]);
      }

      // If sheet has more slides than HTML, add new ones
      if (rows.length > slides.length) {
        var carousel = document.querySelector('.hero-carousel');
        var indicators = document.querySelector('.hero-indicators');
        if (!carousel) return;

        for (var j = slides.length; j < rows.length; j++) {
          var newSlide = slides[0].cloneNode(true);
          newSlide.classList.remove('active');
          updateSlide(newSlide, rows[j]);
          carousel.appendChild(newSlide);

          // Add indicator
          if (indicators) {
            var dot = document.createElement('button');
            dot.className = 'hero-indicator';
            dot.setAttribute('aria-label', 'Go to slide ' + (j + 1));
            indicators.appendChild(dot);
          }
        }
      }

      // If sheet has fewer slides than HTML, hide extras
      if (rows.length < slides.length) {
        for (var k = rows.length; k < slides.length; k++) {
          slides[k].style.display = 'none';
        }
        // Also remove extra indicators
        var allIndicators = document.querySelectorAll('.hero-indicator');
        for (var m = rows.length; m < allIndicators.length; m++) {
          allIndicators[m].style.display = 'none';
        }
      }
    } catch (e) {
      // Keep hardcoded slides on error
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
