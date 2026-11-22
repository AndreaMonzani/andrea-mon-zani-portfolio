(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isClickScrolling = false;
  var scrollTimeout;

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  /* 1. NON-BLOCKING INTRO CURTAIN */
  function initIntroCurtain() {
    var curtain = document.getElementById('introCurtain');
    var tc = document.getElementById('introTimecode');
    if (!curtain) return;

    if (reduceMotion || sessionStorage.getItem('am_intro_seen')) {
      curtain.remove();
      return;
    }

    var isMobile = window.innerWidth <= 600;
    var duration = isMobile ? 260 : 600;
    var start = performance.now();

    function tick(now) {
      var p = clamp((now - start) / duration, 0, 1);
      if (tc) {
        var frames = Math.floor(p * 24);
        var fStr = frames < 10 ? '0' + frames : String(frames);
        tc.textContent = p < 1 ? '00:00:00:' + fStr : '00:00:01:00';
      }
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        curtain.classList.add('is-done');
        sessionStorage.setItem('am_intro_seen', '1');
        setTimeout(function () { curtain.remove(); }, 760);
      }
    }
    requestAnimationFrame(tick);
  }

  /* 2. LANGUAGE SWITCHER */
  function initLanguage() {
    var buttons = document.querySelectorAll('.lang-switch');
    if (!buttons.length) return;

    function syncButtons() {
      var isEn = root.classList.contains('lang-en');
      buttons.forEach(function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === (isEn ? 'en' : 'it') ? 'true' : 'false');
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = btn.getAttribute('data-lang');
        root.classList.toggle('lang-en', lang === 'en');
        root.setAttribute('lang', lang);
        syncButtons();
      });
    });
    syncButtons();
  }

  /* 3. SHAKE-TO-INVERT + HEADER TOGGLE */
  function initThemeAndShake() {
    var toggleBtn = document.getElementById('themeToggle');
    var lastShake = 0;
    var shakeAttached = false;

    function toggleInverted() {
      var isInverted = root.classList.toggle('theme-inverted');
      if (toggleBtn) toggleBtn.setAttribute('aria-pressed', isInverted ? 'true' : 'false');
      var metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', isInverted ? '#EFEDE8' : '#09090B');
    }

    function onDeviceMotion(e) {
      var acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;
      var total = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
      var now = Date.now();
      if (total > 28 && now - lastShake > 1000) {
        lastShake = now;
        toggleInverted();
      }
    }

    function enableShakeListener() {
      if (shakeAttached || !('DeviceMotionEvent' in window)) return;
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
          .then(function (state) {
            if (state === 'granted') {
              window.addEventListener('devicemotion', onDeviceMotion, { passive: true });
              shakeAttached = true;
            }
          }).catch(function () {});
      } else {
        window.addEventListener('devicemotion', onDeviceMotion, { passive: true });
        shakeAttached = true;
      }
    }

    if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission !== 'function') {
      enableShakeListener();
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        enableShakeListener();
        toggleInverted();
      });
    }
  }

  /* 4. HERO STAGE MICRO-TILT (DESKTOP) */
  function initHeroStage() {
    var stage = document.getElementById('heroStage');
    if (!stage || reduceMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    stage.addEventListener('pointerenter', function () { stage.classList.add('is-tilting'); });
    stage.addEventListener('pointermove', function (e) {
      var rect = stage.getBoundingClientRect();
      var relX = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      var relY = clamp((e.clientY - rect.top) / rect.height, 0, 1);
      stage.style.setProperty('--rx', ((0.5 - relY) * 6).toFixed(2) + 'deg');
      stage.style.setProperty('--ry', ((relX - 0.5) * 6).toFixed(2) + 'deg');
      stage.style.setProperty('--mx', (relX * 100).toFixed(1) + '%');
      stage.style.setProperty('--my', (relY * 100).toFixed(1) + '%');
    });
    stage.addEventListener('pointerleave', function () {
      stage.classList.remove('is-tilting');
      stage.style.setProperty('--rx', '0deg');
      stage.style.setProperty('--ry', '0deg');
    });
  }

  /* 5. STICKY HORIZONTAL SHOWCASE (LANDO NORRIS / PASSIONFROOT RHYTHM) */
  function initStickyShowcase() {
    var section = document.getElementById('lavori');
    var track = document.getElementById('showcaseTrack');
    var counter = document.getElementById('showcaseCounter');
    var fill = document.getElementById('showcaseProgress');
    var cards = track ? track.querySelectorAll('.reel-card') : [];
    if (!section || !track || !cards.length) return;

    var totalCards = cards.length;
    var currentX = 0;
    var targetX = 0;
    var rafId = null;

    function getMaxScroll() {
      var viewportW = window.innerWidth;
      var trackW = track.scrollWidth;
      var padLeft = parseFloat(window.getComputedStyle(track.parentElement).paddingLeft) || 0;
      return Math.max(0, trackW - (viewportW - padLeft));
    }

    function renderShowcase() {
      if (window.innerWidth <= 980) {
        track.style.transform = '';
        rafId = null;
        return;
      }

      currentX += (targetX - currentX) * (reduceMotion ? 1 : 0.12);
      track.style.transform = 'translate3d(' + (-currentX).toFixed(1) + 'px, 0, 0)';

      if (Math.abs(targetX - currentX) > 0.25) {
        rafId = requestAnimationFrame(renderShowcase);
      } else {
        rafId = null;
      }
    }

    function onScroll() {
      if (window.innerWidth <= 980) {
        track.style.transform = '';
        return;
      }

      var rect = section.getBoundingClientRect();
      var scrollable = section.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      var progress = clamp(-rect.top / scrollable, 0, 1);
      targetX = progress * getMaxScroll();

      var activeIdx = clamp(Math.round(progress * (totalCards - 1)), 0, totalCards - 1);
      if (counter) {
        var numStr = activeIdx + 1 < 10 ? '0' + (activeIdx + 1) : String(activeIdx + 1);
        var totStr = totalCards < 10 ? '0' + totalCards : String(totalCards);
        counter.textContent = numStr + ' / ' + totStr;
      }
      if (fill) {
        var pct = ((activeIdx + 1) / totalCards) * 100;
        fill.style.width = pct.toFixed(1) + '%';
      }

      if (!rafId) rafId = requestAnimationFrame(renderShowcase);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  /* 6. CUSTOM CURSOR & AMBIENT GRADIENT */
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
    var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    var ringX = mouseX, ringY = mouseY, ringScale = 1;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
      if (!visible) { cursor.classList.add('cursor--visible'); visible = true; }
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

    document.querySelectorAll('[data-video]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('cursor--play'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('cursor--play'); });
    });
    document.querySelectorAll('a:not([data-video]), button:not([data-video])').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('cursor--active'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('cursor--active'); });
    });
    body.addEventListener('mousedown', function () { ringScale = 0.92; });
    body.addEventListener('mouseup', function () { ringScale = 1; });
  }

  function initAmbientMotion() {
    if (reduceMotion) return;
    var cx = window.innerWidth * 0.5, cy = window.innerHeight * 0.25;
    var tx = cx, ty = cy, ticking = false;

    function render() {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      root.style.setProperty('--pointer-x', ((cx / window.innerWidth) * 100).toFixed(2) + '%');
      root.style.setProperty('--pointer-y', ((cy / window.innerHeight) * 100).toFixed(2) + '%');
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) requestAnimationFrame(render);
      else ticking = false;
    }

    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!ticking) { ticking = true; requestAnimationFrame(render); }
    }, { passive: true });
  }

  /* 7. MOTION TABS DESKTOP & SCROLLSPY */
  function updateBubble(bubble, target) {
    if (!bubble || !target) return;
    bubble.style.opacity = '1';
    bubble.style.width = target.offsetWidth + 'px';
    bubble.style.height = target.offsetHeight + 'px';
    bubble.style.transform = 'translate(' + target.offsetLeft + 'px, ' + target.offsetTop + 'px)';
  }

  function initMotionTabs() {
    var wrap = document.querySelector('.desktop-nav-wrap');
    if (!wrap) return;
    var activeBubble = wrap.querySelector('.active-bubble');
    var hoverBubble = wrap.querySelector('.hover-bubble');
    var items = wrap.querySelectorAll('.nav-item-desktop');

    function sync() {
      var activeItem = wrap.querySelector('.active') || items[0];
      updateBubble(activeBubble, activeItem);
      if (hoverBubble) hoverBubble.style.opacity = '0';
    }

    if (document.fonts) document.fonts.ready.then(sync);
    setTimeout(sync, 120);

    items.forEach(function (item) {
      item.addEventListener('mouseenter', function () { updateBubble(hoverBubble, item); });
      item.addEventListener('click', function () {
        if (item.getAttribute('target') === '_blank') return;
        isClickScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function () { isClickScrolling = false; }, 900);
        items.forEach(function (i) { i.classList.remove('active'); });
        item.classList.add('active');
        updateBubble(activeBubble, item);
      });
    });
    wrap.addEventListener('mouseleave', function () { if (hoverBubble) hoverBubble.style.opacity = '0'; });
    window.addEventListener('resize', sync, { passive: true });

    window.addEventListener('scroll', function () {
      if (isClickScrolling) return;
      var scrollPos = window.scrollY + window.innerHeight / 3;
      var currentId = '';
      items.forEach(function (link) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          var sec = document.querySelector(href);
          if (sec && sec.offsetTop <= scrollPos) currentId = href;
        }
      });
      if (currentId) {
        var activeLink = wrap.querySelector('a[href="' + currentId + '"]');
        var cur = wrap.querySelector('a.active');
        if (activeLink && activeLink !== cur) {
          if (cur) cur.classList.remove('active');
          activeLink.classList.add('active');
          updateBubble(activeBubble, activeLink);
        }
      }
    }, { passive: true });
  }

  /* 8. TIMELINE DESKTOP + SCRUBBER MOBILE (ANDROID FIX) */
  function initTimeline() {
    var workflow = document.getElementById('workflow');
    var track = document.getElementById('timelineTrack');
    var steps = document.querySelectorAll('.timeline-step');
    var progress = document.getElementById('timelineProgress');
    var pills = document.querySelectorAll('#processScrubber .scrubber-pill');
    if (!workflow || !steps.length) return;

    function updateDesktop() {
      if (window.innerWidth <= 600 || !progress) return;
      var rect = workflow.getBoundingClientRect();
      var vh = window.innerHeight || root.clientHeight;
      var ratio = clamp((vh * 0.72 - rect.top) / (rect.height + vh * 0.3), 0, 1);
      progress.style.height = (ratio * 100) + '%';

      var mid = vh * 0.48, activeIdx = 0, minD = Infinity;
      steps.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var d = Math.abs(mid - (r.top + r.height / 2));
        if (d < minD) { minD = d; activeIdx = i; }
      });
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i === activeIdx); });
    }

    if (track && pills.length) {
      pills.forEach(function (pill, idx) {
        pill.addEventListener('click', function () {
          var targetStep = steps[idx];
          if (targetStep) track.scrollTo({ left: targetStep.offsetLeft, behavior: 'smooth' });
        });
      });

      track.addEventListener('scroll', function () {
        if (window.innerWidth > 600) return;
        var cardW = steps[0].offsetWidth + 14;
        var idx = clamp(Math.round(track.scrollLeft / cardW), 0, pills.length - 1);
        pills.forEach(function (p, i) {
          p.classList.toggle('is-active', i === idx);
          p.setAttribute('aria-selected', i === idx ? 'true' : 'false');
        });
      }, { passive: true });
    }

    window.addEventListener('scroll', updateDesktop, { passive: true });
    window.addEventListener('resize', updateDesktop);
    updateDesktop();
  }

  /* 9. LIGHTBOX YOUTUBE ON-DEMAND */
  function initLightbox() {
    var triggers = document.querySelectorAll('[data-video]');
    var lightbox = document.getElementById('lightbox');
    if (!triggers.length || !lightbox) return;
    var frameNode = lightbox.querySelector('.lightbox-frame');
    var closeBtn = lightbox.querySelector('.lightbox-close');
    var lastFocused = null;

    function openVideo(videoId, title) {
      Array.from(frameNode.children).forEach(function (n) { if (n !== closeBtn) frameNode.removeChild(n); });
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0&playsinline=1';
      iframe.title = title || 'Video';
      iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
      iframe.setAttribute('allowfullscreen', 'true');
      frameNode.insertBefore(iframe, closeBtn);
      lightbox.setAttribute('aria-hidden', 'false');
      body.classList.add('lightbox-open');
      setTimeout(function () { closeBtn.focus(); }, 60);
    }

    function close() {
      lightbox.setAttribute('aria-hidden', 'true');
      body.classList.remove('lightbox-open');
      Array.from(frameNode.children).forEach(function (n) { if (n !== closeBtn) frameNode.removeChild(n); });
      if (lastFocused) lastFocused.focus();
    }

    triggers.forEach(function (t) {
      t.addEventListener('click', function () {
        lastFocused = t;
        openVideo(t.getAttribute('data-video'), t.getAttribute('data-title'));
      });
    });
    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') close();
    });
  }

  /* 10. GAFFER TAPE PEEL-OFF (Animazione visibile anche su Android Touch) */
  function initPhoneReveal() {
    var btn = document.getElementById('phoneReveal');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      if (!btn.classList.contains('is-revealed')) {
        e.preventDefault();
        btn.classList.add('is-peeling');
        if (navigator.vibrate) navigator.vibrate(18);
        setTimeout(function () {
          btn.classList.add('is-revealed');
          btn.setAttribute('aria-expanded', 'true');
        }, 120);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initIntroCurtain();
    initLanguage();
    initThemeAndShake();
    initHeroStage();
    initStickyShowcase();
    initCursor();
    initAmbientMotion();
    initMotionTabs();
    initTimeline();
    initLightbox();
    initPhoneReveal();
  });
})();