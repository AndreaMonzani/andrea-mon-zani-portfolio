(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isClickScrolling = false;
  var scrollTimeout;

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  /* 1. LANGUAGE SWITCHER */
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

  /* 2. SHAKE-TO-INVERT + HEADER TOGGLE */
  function initThemeAndShake() {
    var toggleBtn = document.getElementById('themeToggle');
    var lastShake = 0;
    var shakeAttached = false;

    function toggleInverted() {
      var isInverted = root.classList.toggle('theme-inverted');
      if (toggleBtn) toggleBtn.setAttribute('aria-pressed', isInverted ? 'true' : 'false');
      var metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', isInverted ? '#EFEDE8' : '#0B0B0C');
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
          })
          .catch(function () {});
      } else {
        window.addEventListener('devicemotion', onDeviceMotion, { passive: true });
        shakeAttached = true;
      }
    }

    // Attiva automaticamente su Android / browser senza permesso esplicito
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

  /* 3. CUSTOM CURSOR */
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

    body.addEventListener('mousedown', function () { ringScale = 0.92; });
    body.addEventListener('mouseup', function () { ringScale = 1; });
  }

  /* 4. AMBIENT GRADIENT MOTION */
  function initAmbientMotion() {
    if (reduceMotion) return;
    var currentX = window.innerWidth * 0.5;
    var currentY = window.innerHeight * 0.25;
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

    requestTick();
  }

  /* 5. HERO 3D: MAGNETIC OBSIDIAN BLADES */
  function initHeroBlades() {
    var container = document.getElementById('heroBlades');
    if (!container) return;
    var cards = Array.from(container.querySelectorAll('.blade-card'));
    if (!cards.length) return;

    var count = cards.length;
    var activeIndex = 0;
    var targetFocus = 0;
    var currentFocus = 0;
    var pointerX = 0; // -1 .. 1
    var pointerY = 0; // -1 .. 1
    var curPX = 0;
    var curPY = 0;
    var isHovering = false;

    function updateFocusedClass(idx) {
      cards.forEach(function (card, i) {
        card.classList.toggle('is-focused', i === idx);
      });
    }

    function layoutBlades() {
      var isMobile = window.innerWidth <= 600;
      var spreadX = isMobile ? 34 : 58;
      var spreadZ = isMobile ? 42 : 70;
      var baseRotY = isMobile ? -14 : -22;

      currentFocus += (targetFocus - currentFocus) * (reduceMotion ? 1 : 0.12);
      curPX += (pointerX - curPX) * (reduceMotion ? 1 : 0.1);
      curPY += (pointerY - curPY) * (reduceMotion ? 1 : 0.1);

      cards.forEach(function (card, i) {
        var delta = i - currentFocus;
        var absDelta = Math.abs(delta);

        // Repulsione magnetica: le lame si aprono attorno alla lama attiva
        var fanPush = isHovering ? (delta * (isMobile ? 16 : 34)) : 0;
        var tx = delta * spreadX + fanPush + curPX * (10 - absDelta * 1.5);
        var ty = absDelta * (isMobile ? 6 : 10) + curPY * (8 - absDelta);
        var tz = -absDelta * spreadZ + (absDelta < 0.5 ? 60 : 0);

        var ry = delta === 0 ? curPX * 10 : (delta > 0 ? baseRotY : -baseRotY * 0.75) + curPX * 8;
        var rx = -curPY * 8;
        var scale = clamp(1 - absDelta * 0.08, 0.7, 1.04);
        var opacity = clamp(1 - absDelta * 0.16, 0.32, 1);

        card.style.transform =
          'translate3d(' + tx.toFixed(1) + 'px, ' + ty.toFixed(1) + 'px, ' + tz.toFixed(1) + 'px) ' +
          'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
        card.style.opacity = opacity.toFixed(2);
        card.style.zIndex = String(Math.round(100 - absDelta * 10));
      });

      if (!reduceMotion) requestAnimationFrame(layoutBlades);
    }

    function handlePointer(clientX, clientY) {
      var rect = container.getBoundingClientRect();
      var relX = clamp((clientX - rect.left) / rect.width, 0, 1);
      var relY = clamp((clientY - rect.top) / rect.height, 0, 1);
      pointerX = (relX - 0.5) * 2;
      pointerY = (relY - 0.5) * 2;

      var idx = clamp(Math.floor(relX * count), 0, count - 1);
      if (idx !== activeIndex) {
        activeIndex = idx;
        targetFocus = idx;
        updateFocusedClass(activeIndex);
      }

      // Aggiorna la rifrazione luminosa sulla lama attiva
      var activeCard = cards[activeIndex];
      if (activeCard) {
        var cRect = activeCard.getBoundingClientRect();
        var mx = clamp(((clientX - cRect.left) / cRect.width) * 100, 0, 100);
        var my = clamp(((clientY - cRect.top) / cRect.height) * 100, 0, 100);
        activeCard.style.setProperty('--mx', mx.toFixed(1) + '%');
        activeCard.style.setProperty('--my', my.toFixed(1) + '%');
      }
    }

    container.addEventListener('pointerenter', function () { isHovering = true; });
    container.addEventListener('pointermove', function (e) {
      isHovering = true;
      handlePointer(e.clientX, e.clientY);
    });
    container.addEventListener('pointerleave', function () {
      isHovering = false;
      pointerX = 0;
      pointerY = 0;
    });

    // Supporto scrubbing fluido su smartphone
    container.addEventListener('touchmove', function (e) {
      if (e.touches.length) {
        isHovering = true;
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    cards.forEach(function (card, idx) {
      card.addEventListener('focus', function () {
        activeIndex = idx;
        targetFocus = idx;
        updateFocusedClass(activeIndex);
      });
    });

    updateFocusedClass(0);
    layoutBlades();
  }

  /* 6. REVEAL */
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

  /* 7. MOTION TABS */
  function updateBubble(bubble, target) {
    if (!bubble) return;
    if (!target) { bubble.style.opacity = '0'; return; }
    bubble.style.opacity = '1';
    bubble.style.width = target.offsetWidth + 'px';
    bubble.style.height = target.offsetHeight + 'px';
    bubble.style.transform = 'translate(' + target.offsetLeft + 'px, ' + target.offsetTop + 'px)';
  }

  function updateHoverBubbleFull(bubble, wrap) {
    if (!bubble) return;
    if (wrap.classList.contains('desktop-nav-wrap')) {
      bubble.style.opacity = '1';
      bubble.style.width = (wrap.offsetWidth - 12) + 'px';
      bubble.style.height = (wrap.offsetHeight - 12) + 'px';
      bubble.style.transform = 'translate(6px, 6px)';
    } else {
      bubble.style.opacity = '0';
    }
  }

  function initMotionTabs() {
    var wraps = document.querySelectorAll('.desktop-nav-wrap, .workflow-tabs');
    wraps.forEach(function (wrap) {
      var activeBubble = wrap.querySelector('.active-bubble');
      var hoverBubble = wrap.querySelector('.hover-bubble');
      var items = wrap.querySelectorAll('.nav-item-desktop, .tab-num');

      function sync() {
        var activeItem = wrap.querySelector('.active') || items[0];
        if (activeItem && activeBubble) updateBubble(activeBubble, activeItem);
        if (hoverBubble) updateHoverBubbleFull(hoverBubble, wrap);
      }

      if (document.fonts) document.fonts.ready.then(sync);
      else window.addEventListener('load', sync);
      setTimeout(sync, 120);

      items.forEach(function (item) {
        item.addEventListener('mouseenter', function () {
          if (hoverBubble) updateBubble(hoverBubble, item);
        });
        item.addEventListener('mouseleave', function () {
          if (hoverBubble) updateHoverBubbleFull(hoverBubble, wrap);
        });
        item.addEventListener('click', function () {
          if (item.getAttribute('target') === '_blank') return;
          if (item.classList.contains('nav-item-desktop')) {
            isClickScrolling = true;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function () { isClickScrolling = false; }, 1000);
          }
          items.forEach(function (i) { i.classList.remove('active'); });
          item.classList.add('active');
          updateBubble(activeBubble, item);
        });
      });

      wrap.addEventListener('mouseleave', function () {
        if (hoverBubble) updateHoverBubbleFull(hoverBubble, wrap);
      });
    });

    window.addEventListener('resize', function () {
      document.querySelectorAll('.desktop-nav-wrap, .workflow-tabs').forEach(function (wrap) {
        var activeItem = wrap.querySelector('.active');
        var activeBubble = wrap.querySelector('.active-bubble');
        if (activeItem && activeBubble) updateBubble(activeBubble, activeItem);
      });
    }, { passive: true });
  }

  /* 8. TIMELINE */
  function initTimeline() {
    var workflow = document.getElementById('workflow');
    var steps = document.querySelectorAll('.timeline-step');
    var progress = document.getElementById('timelineProgress');
    var glow = document.querySelector('.timeline-axis-glow');
    var cinematic = document.querySelector('.timeline-cinematic');
    var workflowTabs = document.querySelector('.workflow-tabs');
    var workflowTabsContainer = document.querySelector('.workflow-tabs-container');
    if (!workflow || !steps.length) return;

    function updateDesktop() {
      if (window.innerWidth > 600 && progress && glow) {
        var rect = workflow.getBoundingClientRect();
        var vh = window.innerHeight || root.clientHeight;
        var ratio = clamp((vh * 0.72 - rect.top) / (rect.height + vh * 0.35), 0, 1);
        progress.style.height = (ratio * 100) + '%';
        glow.style.top = 'calc(' + (ratio * 100) + '% - 60px)';

        var viewportMid = vh * 0.48;
        var activeIndex = 0;
        var minDistance = Infinity;
        steps.forEach(function (step, index) {
          var stepRect = step.getBoundingClientRect();
          var distance = Math.abs(viewportMid - (stepRect.top + stepRect.height / 2));
          if (distance < minDistance) { minDistance = distance; activeIndex = index; }
        });
        steps.forEach(function (step, index) {
          step.classList.toggle('is-active', index === activeIndex && rect.top < vh && rect.bottom > 0);
        });
      }
    }

    if (cinematic && workflowTabs) {
      var nums = workflowTabs.querySelectorAll('.tab-num');
      var activeBubble = workflowTabs.querySelector('.active-bubble');
      cinematic.addEventListener('scroll', function () {
        if (window.innerWidth > 600) return;
        var cardWidth = cinematic.children[0].offsetWidth;
        var index = Math.round(cinematic.scrollLeft / (cardWidth + 16));
        if (nums[index] && !nums[index].classList.contains('active')) {
          nums.forEach(function (n) { n.classList.remove('active'); });
          nums[index].classList.add('active');
          updateBubble(activeBubble, nums[index]);
          if (workflowTabsContainer) {
            var numOffset = nums[index].offsetLeft;
            workflowTabsContainer.scrollTo({ left: numOffset - workflowTabsContainer.offsetWidth / 2 + nums[index].offsetWidth / 2, behavior: 'smooth' });
          }
        }
      }, { passive: true });
      nums.forEach(function (num, i) {
        num.addEventListener('click', function () {
          cinematic.scrollTo({ left: i * (cinematic.children[0].offsetWidth + 16), behavior: 'smooth' });
        });
      });
    }

    if (reduceMotion) {
      steps.forEach(function (step) { step.classList.add('is-active'); });
      if (progress) progress.style.height = '100%';
      return;
    }

    window.addEventListener('scroll', updateDesktop, { passive: true });
    window.addEventListener('resize', updateDesktop);
    updateDesktop();
  }

  /* 9. SWIPE HINTS */
  function initSwipeHints() {
    document.querySelectorAll('.works-grid, .timeline-cinematic').forEach(function (c) {
      var section = c.closest('section');
      if (!section) return;
      var hint = section.querySelector('.swipe-hint');
      c.addEventListener('scroll', function () {
        if (hint && c.scrollLeft > 20) hint.classList.add('is-hidden');
      }, { passive: true });

      var dotsContainer = section.querySelector('.works-indicators');
      if (dotsContainer) {
        var dots = dotsContainer.querySelectorAll('.dot');
        var items = c.children;
        if (dots.length && items.length) {
          c.addEventListener('scroll', function () {
            var index = Math.round(c.scrollLeft / (items[0].offsetWidth + 16));
            dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
          }, { passive: true });
        }
      }
    });
  }

  /* 10. LIGHTBOX */
  function openVideo(videoId, title, lightbox, frameNode, closeBtnNode) {
    Array.from(frameNode.children).forEach(function (node) {
      if (node !== closeBtnNode) frameNode.removeChild(node);
    });
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0&playsinline=1';
    iframe.title = title || 'Video';
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('frameborder', '0');

    frameNode.insertBefore(iframe, closeBtnNode);
    lightbox.setAttribute('aria-hidden', 'false');
    body.classList.add('lightbox-open');
    window.setTimeout(function () { closeBtnNode.focus(); }, 60);
  }

  function initLightbox() {
    var triggers = document.querySelectorAll('[data-video]');
    var lightbox = document.getElementById('lightbox');
    if (!triggers.length || !lightbox) return;
    var frameNode = lightbox.querySelector('.lightbox-frame');
    var closeBtnNode = lightbox.querySelector('.lightbox-close');
    var lastFocused = null;

    function close() {
      lightbox.setAttribute('aria-hidden', 'true');
      body.classList.remove('lightbox-open');
      Array.from(frameNode.children).forEach(function (node) {
        if (node !== closeBtnNode) frameNode.removeChild(node);
      });
      if (lastFocused) lastFocused.focus();
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        lastFocused = trigger;
        openVideo(trigger.getAttribute('data-video'), trigger.getAttribute('data-title'), lightbox, frameNode, closeBtnNode);
      });
    });

    closeBtnNode.addEventListener('click', close);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') close();
    });
  }

  /* 11. PHONE PEEL-OFF (Primo clic rivela, secondo clic chiama) */
  function initPhoneReveal() {
    var btn = document.querySelector('.phone-reveal');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      if (!btn.classList.contains('is-revealed')) {
        e.preventDefault();
        btn.classList.add('is-revealed');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  /* 12. SCROLLSPY */
  function initScrollSpy() {
    var desktopLinks = document.querySelectorAll('.desktop-nav-wrap .nav-item-desktop');
    if (!desktopLinks.length) return;
    var activeBubble = document.querySelector('.desktop-nav-wrap .active-bubble');

    window.addEventListener('scroll', function () {
      if (isClickScrolling) return;
      var scrollPos = window.scrollY + window.innerHeight / 3;
      var currentId = '';
      desktopLinks.forEach(function (link) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          var section = document.querySelector(href);
          if (section && section.offsetTop <= scrollPos) currentId = href;
        }
      });
      if (currentId) {
        var activeLink = document.querySelector('.desktop-nav-wrap a[href="' + currentId + '"]');
        var currentActive = document.querySelector('.desktop-nav-wrap a.active');
        if (activeLink && activeLink !== currentActive) {
          if (currentActive) currentActive.classList.remove('active');
          activeLink.classList.add('active');
          if (activeBubble) updateBubble(activeBubble, activeLink);
        }
      }
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLanguage();
    initThemeAndShake();
    initCursor();
    initAmbientMotion();
    initHeroBlades();
    initReveal();
    initMotionTabs();
    initTimeline();
    initSwipeHints();
    initLightbox();
    initPhoneReveal();
    initScrollSpy();
  });
})();