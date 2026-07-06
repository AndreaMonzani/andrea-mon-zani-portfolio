(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var body = document.body;
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function initLanguage() {
    var buttons = document.querySelectorAll('.lang-switch');
    if (!buttons.length) return;

    function syncButtons() {
      var isEn = root.classList.contains('lang-en');
      buttons.forEach(function (button) {
        var active = button.getAttribute('data-lang') === (isEn ? 'en' : 'it');
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var lang = button.getAttribute('data-lang');
        root.classList.toggle('lang-en', lang === 'en');
        root.setAttribute('lang', lang);
        syncButtons();
      });
    });

    syncButtons();
  }

  function initIntro() {
    var intro = document.getElementById('intro');
    if (!intro) return;

    if (reduceMotion) {
      intro.style.display = 'none';
      return;
    }

    var skipBtn = document.getElementById('introSkip');
    var done = false;

    function end() {
      if (done) return;
      done = true;
      intro.classList.add('is-leaving');
      window.setTimeout(function () {
        intro.style.display = 'none';
      }, 700);
    }

    window.setTimeout(end, 1900);
    if (skipBtn) skipBtn.addEventListener('click', end);
    window.addEventListener('keydown', end, { once: true });
    window.addEventListener('pointerdown', end, { once: true });
  }

  function initCursor() {
    var cursor = document.querySelector('.cursor');
    if (!cursor) return;
    var isFine = window.matchMedia('(pointer: fine)').matches;
    if (!isFine || reduceMotion) return;

    body.classList.add('has-custom-cursor');

    var x = 0, y = 0, cx = 0, cy = 0;

    window.addEventListener('pointermove', function (event) {
      x = event.clientX;
      y = event.clientY;
      cursor.style.opacity = 1;
    });

    function raf() {
      cx += (x - cx) * 0.25;
      cy += (y - cy) * 0.25;
      cursor.style.transform = 'translate(' + cx + 'px, ' + cy + 'px)';
      requestAnimationFrame(raf);
    }
    raf();

    document.querySelectorAll('a, button, [data-video], .work-card').forEach(function (el) {
      var state = el.matches('[data-video], .showreel-trigger') ? 'media' : el.matches('.work-card') ? 'card' : 'link';
      el.addEventListener('mouseenter', function () { cursor.setAttribute('data-state', state); });
      el.addEventListener('mouseleave', function () { cursor.removeAttribute('data-state'); });
    });

    document.addEventListener('mouseleave', function () {
      cursor.style.opacity = 0;
    });
  }

  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    els.forEach(function (el) { io.observe(el); });
  }

  function initTimeline() {
    var workflow = document.getElementById('workflow');
    var steps = document.querySelectorAll('.timeline-step');
    var progress = document.getElementById('timelineProgress');
    var glow = document.querySelector('.timeline-axis-glow');

    if (!workflow || !steps.length || !progress || !glow) return;

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function update() {
      var rect = workflow.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var total = rect.height + vh * 0.35;
      var raw = (vh * 0.72 - rect.top) / total;
      var ratio = clamp(raw, 0, 1);

      progress.style.height = (ratio * 100) + '%';
      glow.style.top = 'calc(' + (ratio * 100) + '% - 60px)';

      var viewportMid = vh * 0.48;
      var activeIndex = 0;
      var minDistance = Infinity;

      steps.forEach(function (step, index) {
        var stepRect = step.getBoundingClientRect();
        var stepMid = stepRect.top + stepRect.height / 2;
        var distance = Math.abs(viewportMid - stepMid);

        if (distance < minDistance) {
          minDistance = distance;
          activeIndex = index;
        }

        if (stepRect.top < vh * 0.88) {
          step.classList.add('is-visible');
        }
      });

      steps.forEach(function (step, index) {
        step.classList.toggle('is-active', index === activeIndex && rect.top < vh && rect.bottom > 0);
      });
    }

    if (reduceMotion) {
      steps.forEach(function (step) {
        step.classList.add('is-visible');
      });
      progress.style.height = '100%';
      glow.style.top = 'calc(100% - 60px)';
      return;
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  function initPhoneReveal() {
    var btn = document.querySelector('.phone-reveal');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var revealed = btn.classList.toggle('is-revealed');
      btn.setAttribute('aria-pressed', revealed ? 'true' : 'false');
    });
  }

  function initLightbox() {
    var lightbox = document.getElementById('lightbox');
    var triggers = document.querySelectorAll('[data-video]');
    if (!lightbox || !triggers.length) return;

    var frame = lightbox.querySelector('.lightbox-frame');
    var closeBtn = lightbox.querySelector('.lightbox-close');
    var mainEl = document.getElementById('main');
    var headerEl = document.querySelector('.site-header');
    var footerEl = document.querySelector('footer');
    var lastFocused = null;

    function clearFrame() {
      while (frame.firstChild && frame.firstChild !== closeBtn) {
        frame.removeChild(frame.firstChild);
      }
    }

    function buildPlaceholder() {
      var div = document.createElement('div');
      div.className = 'lightbox-placeholder';
      div.innerHTML = '<span class="it">Anteprima video: collega un URL YouTube reale a questa card.</span><span class="en">Video preview: connect a real YouTube URL to this card.</span>';
      return div;
    }

    function open(trigger) {
      lastFocused = trigger;
      var videoId = trigger.getAttribute('data-video');
      var title = trigger.getAttribute('data-title') || 'Video';

      clearFrame();

      if (videoId) {
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0';
        iframe.title = title;
        iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        frame.insertBefore(iframe, closeBtn);
      } else {
        frame.insertBefore(buildPlaceholder(), closeBtn);
      }

      lightbox.setAttribute('aria-hidden', 'false');
      lightbox.setAttribute('aria-label', title);
      body.classList.add('lightbox-open');
      [mainEl, headerEl, footerEl].forEach(function (el) {
        if (el) el.setAttribute('aria-hidden', 'true');
      });

      window.setTimeout(function () { closeBtn.focus(); }, 60);
      document.addEventListener('keydown', onKeydown);
    }

    function close() {
      lightbox.setAttribute('aria-hidden', 'true');
      body.classList.remove('lightbox-open');
      clearFrame();
      [mainEl, headerEl, footerEl].forEach(function (el) {
        if (el) el.removeAttribute('aria-hidden');
      });
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused) lastFocused.focus();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key === 'Tab') {
        var focusables = lightbox.querySelectorAll('button, [href], iframe');
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () { open(trigger); });
      trigger.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(trigger);
        }
      });
    });

    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) close();
    });
  }

  initLanguage();
  initIntro();
  initCursor();
  initReveal();
  initTimeline();
  initPhoneReveal();
  initLightbox();
})();
