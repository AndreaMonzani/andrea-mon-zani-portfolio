(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  function initCursor() {
    var cursor = document.querySelector('.cursor');
    if (!cursor || 'ontouchstart' in window) {
      if (cursor) cursor.style.display = 'none';
      return;
    }

    var ring = cursor.querySelector('.cursor-ring');
    var dot = cursor.querySelector('.cursor-dot');
    var label = cursor.querySelector('.cursor-label');
    var visible = false;

    if (ring) {
      ring.style.transition = 'width 0.2s ease, height 0.2s ease, top 0.2s ease, left 0.2s ease, border-color 0.2s ease, opacity 0.2s ease';
    }

    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var ringX = mouseX;
    var ringY = mouseY;
    var ringScale = 1;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        cursor.classList.add('cursor--visible');
        visible = true;
      }
    }, { passive: true });

    function renderCursor() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;

      if (dot) dot.style.transform = 'translate(' + mouseX + 'px, ' + mouseY + 'px)';
      if (ring) ring.style.transform = 'translate(' + ringX + 'px, ' + ringY + 'px) scale(' + ringScale + ')';
      if (label) label.style.transform = 'translate(' + ringX + 'px, ' + ringY + 'px)';

      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    document.querySelectorAll('.showreel-btn-massive, [data-video]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('cursor--play'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('cursor--play'); });
    });

    document.querySelectorAll('a:not([data-video]), button:not(.showreel-btn-massive):not([data-video])').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('cursor--active'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('cursor--active'); });
    });

    body.addEventListener('mousedown', function () {
      ringScale = 0.94;
    });

    body.addEventListener('mouseup', function () {
      ringScale = 1;
    });
  }

  function initAmbientMotion() {
    if (reduceMotion) return;
    var currentX = window.innerWidth * 0.5;
    var currentY = window.innerHeight * 0.2;
    var targetX = currentX;
    var targetY = currentY;
    var currentScroll = 0;
    var targetScroll = 0;
    var ticking = false;

    function render() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      currentScroll += (targetScroll - currentScroll) * 0.08;
      root.style.setProperty('--pointer-x', ((currentX / window.innerWidth) * 100).toFixed(2) + '%');
      root.style.setProperty('--pointer-y', ((currentY / window.innerHeight) * 100).toFixed(2) + '%');
      root.style.setProperty('--scroll-shift', (currentScroll * 0.12).toFixed(2) + 'px');

      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1 || Math.abs(targetScroll - currentScroll) > 0.1) {
        requestAnimationFrame(render);
      } else {
        ticking = false;
      }
    }

    function requestTick() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(render);
      }
    }

    window.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      requestTick();
    }, { passive: true });

    window.addEventListener('scroll', function () {
      targetScroll = window.scrollY || window.pageYOffset;
      requestTick();
    }, { passive: true });

    window.addEventListener('resize', function () {
      targetX = clamp(targetX, 0, window.innerWidth);
      targetY = clamp(targetY, 0, window.innerHeight);
      requestTick();
    });

    requestTick();
  }

  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (el) {
        el.classList.add('is-visible');
      });
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

    els.forEach(function (el) {
      io.observe(el);
    });
  }

  function initTimeline() {
    var workflow = document.getElementById('workflow');
    var steps = document.querySelectorAll('.timeline-step');
    var progress = document.getElementById('timelineProgress');
    var glow = document.querySelector('.timeline-axis-glow');
    if (!workflow || !steps.length || !progress || !glow) return;

    function update() {
      if (window.innerWidth <= 600) return;

      var rect = workflow.getBoundingClientRect();
      var vh = window.innerHeight || root.clientHeight;
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
      });

      steps.forEach(function (step, index) {
        step.classList.toggle('is-active', index === activeIndex && rect.top < vh && rect.bottom > 0);
      });
    }

    if (reduceMotion) {
      steps.forEach(function (step) {
        step.classList.add('is-active');
      });
      progress.style.height = '100%';
      glow.style.top = 'calc(100% - 60px)';
      return;
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  function initSwipeHints() {
    var carousels = document.querySelectorAll('.works-grid, .timeline-cinematic');
    carousels.forEach(function (c) {
      var section = c.closest('section');
      if (!section) return;
      var hint = section.querySelector('.swipe-hint');
      if (!hint) return;
      
      c.addEventListener('scroll', function () {
        if (c.scrollLeft > 20) {
          hint.classList.add('is-hidden');
        }
      }, { passive: true });
    });
  }

  function openVideo(videoId, title, lightbox, frameNode, closeBtnNode) {
    var oldLinks = lightbox.querySelectorAll('.lightbox-fallback');
    oldLinks.forEach(function (link) { link.remove(); });

    Array.from(frameNode.children).forEach(function (node) {
      if (node !== closeBtnNode) frameNode.removeChild(node);
    });

    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0&playsinline=1';
    iframe.title = title || 'Video';
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('frameborder', '0');

    var fallbackLink = document.createElement('a');
    fallbackLink.href = 'https://www.youtube.com/watch?v=' + videoId;
    fallbackLink.target = '_blank';
    fallbackLink.className = 'lightbox-fallback';
    fallbackLink.innerHTML = 'Il video non si carica? Clicca qui per aprirlo su YouTube ↗';

    frameNode.insertBefore(iframe, closeBtnNode);
    lightbox.appendChild(fallbackLink);

    lightbox.setAttribute('aria-hidden', 'false');
    body.classList.add('lightbox-open');
    window.setTimeout(function () { closeBtnNode.focus(); }, 60);
  }

  function initLightbox() {
    var triggers = document.querySelectorAll('[data-video]');
    if (!triggers.length) return;
    var lightbox = document.getElementById('lightbox');
    var frameNode = lightbox.querySelector('.lightbox-frame');
    var closeBtnNode = lightbox.querySelector('.lightbox-close');
    var lastFocused = null;

    function clearFrame() {
      Array.from(frameNode.children).forEach(function (node) {
        if (node !== closeBtnNode) frameNode.removeChild(node);
      });
      var oldLinks = lightbox.querySelectorAll('.lightbox-fallback');
      oldLinks.forEach(function (link) { link.remove(); });
    }

    function close() {
      lightbox.setAttribute('aria-hidden', 'true');
      body.classList.remove('lightbox-open');
      clearFrame();
      if (lastFocused) lastFocused.focus();
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        lastFocused = trigger;
        openVideo(trigger.getAttribute('data-video'), trigger.getAttribute('data-title'), lightbox, frameNode, closeBtnNode);
      });

      trigger.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          lastFocused = trigger;
          openVideo(trigger.getAttribute('data-video'), trigger.getAttribute('data-title'), lightbox, frameNode, closeBtnNode);
        }
      });
    });

    closeBtnNode.addEventListener('click', close);
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') {
        close();
      }
    });
  }

  function initPhoneReveal() {
    var btn = document.querySelector('.phone-reveal');
    var phoneWrap = document.getElementById('phone-number');
    if (!btn || !phoneWrap) return;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      phoneWrap.hidden = open;
      btn.classList.toggle('is-revealed', !open);
    });
  }

  function initMonitor() {
    var monitor = document.getElementById('heroMonitor');
    if (!monitor) return;

    var restRX = 8, restRY = -10, maxTiltX = 5, maxTiltY = 6;
    var curRX = restRX, curRY = restRY, targetRX = restRX, targetRY = restRY, ticking = false;

    monitor.style.setProperty('--monitor-rx', restRX + 'deg');
    monitor.style.setProperty('--monitor-ry', restRY + 'deg');

    if (reduceMotion) {
      monitor.setAttribute('data-scene', 'timeline');
      return;
    }

    function render() {
      curRX += (targetRX - curRX) * 0.08;
      curRY += (targetRY - curRY) * 0.08;
      monitor.style.setProperty('--monitor-rx', curRX.toFixed(2) + 'deg');
      monitor.style.setProperty('--monitor-ry', curRY.toFixed(2) + 'deg');
      if (Math.abs(targetRX - curRX) > 0.02 || Math.abs(targetRY - curRY) > 0.02) requestAnimationFrame(render);
      else ticking = false;
    }

    function requestTick() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(render);
      }
    }

    function sceneFromPointer(x) {
      if (x < 0.34) return 'black';
      if (x < 0.67) return 'timeline';
      return 'grade';
    }

    function onMove(e) {
      var rect = monitor.getBoundingClientRect();
      var relX = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      var relY = clamp((e.clientY - rect.top) / rect.height, 0, 1);
      var offX = (relX - 0.5) * 2;
      var offY = (relY - 0.5) * 2;
      targetRY = restRY + offX * maxTiltY;
      targetRX = restRX - offY * maxTiltX;
      monitor.setAttribute('data-scene', sceneFromPointer(relX));
      requestTick();
    }

    function onEnter() {
      monitor.classList.add('is-hovering');
      requestTick();
    }

    function onLeave() {
      monitor.classList.remove('is-hovering');
      targetRX = restRX;
      targetRY = restRY;
      monitor.setAttribute('data-scene', 'black');
      requestTick();
    }

    function onScroll() {
      var hero = monitor.closest('.hero');
      if (!hero) return;
      var rect = hero.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      var p = clamp(1 - rect.top / vh, 0, 1);
      if (!monitor.classList.contains('is-hovering')) {
        targetRY = restRY + p * 4;
        targetRX = restRX - p * 2;
        if (p > 0.55) monitor.setAttribute('data-scene', 'grade');
        else if (p > 0.25) monitor.setAttribute('data-scene', 'timeline');
        else monitor.setAttribute('data-scene', 'black');
        requestTick();
      }
    }

    monitor.addEventListener('pointermove', onMove);
    monitor.addEventListener('pointerenter', onEnter);
    monitor.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLanguage();
    initCursor();
    initAmbientMotion();
    initReveal();
    initTimeline();
    initSwipeHints();
    initMonitor();
    initLightbox();
    initPhoneReveal();
  });
})();