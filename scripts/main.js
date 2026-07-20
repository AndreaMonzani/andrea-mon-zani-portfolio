(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Variabili per bloccare temporaneamente lo scrollSpy quando si clicca un link
  var isClickScrolling = false;
  var scrollTimeout;

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

  // --- LOGICA MOTION TABS ---
  function updateBubble(bubble, target) {
    if (!bubble) return;
    if (!target) {
      bubble.style.opacity = '0';
      return;
    }
    bubble.style.opacity = '1';
    bubble.style.width = target.offsetWidth + 'px';
    bubble.style.height = target.offsetHeight + 'px';
    bubble.style.transform = 'translate(' + target.offsetLeft + 'px, ' + target.offsetTop + 'px)';
  }

  function updateHoverBubbleFull(bubble, wrap) {
    if (!bubble) return;
    var isDesktop = wrap.classList.contains('desktop-nav-wrap');
    if (isDesktop) {
      bubble.style.opacity = '1';
      bubble.style.width = (wrap.offsetWidth - 12) + 'px'; // -12px calcola i padding laterali
      bubble.style.height = (wrap.offsetHeight - 12) + 'px';
      bubble.style.transform = 'translate(6px, 6px)';
    } else {
      bubble.style.opacity = '0'; // Non mostriamo hover bubble intero sui numeri mobile
    }
  }

  function initMotionTabs() {
    var wraps = document.querySelectorAll('.desktop-nav-wrap, .workflow-tabs');
    
    wraps.forEach(function(wrap) {
      var activeBubble = wrap.querySelector('.active-bubble');
      var hoverBubble = wrap.querySelector('.hover-bubble');
      var items = wrap.querySelectorAll('.nav-item-desktop, .tab-num');

      function sync() {
        var activeItem = wrap.querySelector('.active') || items[0];
        if (activeItem && activeBubble) {
          updateBubble(activeBubble, activeItem);
        }
        if (hoverBubble) {
          updateHoverBubbleFull(hoverBubble, wrap);
        }
      }

      if (document.fonts) {
        document.fonts.ready.then(sync);
      } else {
        window.addEventListener('load', sync);
      }
      setTimeout(sync, 100);

      items.forEach(function(item) {
        item.addEventListener('mouseenter', function() {
          if (hoverBubble) updateBubble(hoverBubble, item);
        });
        item.addEventListener('mouseleave', function() {
          if (hoverBubble) updateHoverBubbleFull(hoverBubble, wrap);
        });
        item.addEventListener('click', function() {
          // Quando clicca, disattiviamo scrollSpy per 1 secondo 
          // per evitare l'effetto "saltino indietro"
          if (item.classList.contains('nav-item-desktop')) {
            isClickScrolling = true;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
              isClickScrolling = false;
            }, 1000); 
          }

          items.forEach(function(i) { i.classList.remove('active'); });
          item.classList.add('active');
          updateBubble(activeBubble, item);
        });
      });

      wrap.addEventListener('mouseleave', function() {
        if (hoverBubble) updateHoverBubbleFull(hoverBubble, wrap);
      });
    });

    window.addEventListener('resize', function() {
      document.querySelectorAll('.desktop-nav-wrap, .workflow-tabs').forEach(function(wrap) {
        var activeItem = wrap.querySelector('.active');
        var activeBubble = wrap.querySelector('.active-bubble');
        if (activeItem && activeBubble) updateBubble(activeBubble, activeItem);
      });
    }, { passive: true });
  }

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
    }

    if (cinematic && workflowTabs) {
      var nums = workflowTabs.querySelectorAll('.tab-num');
      var activeBubble = workflowTabs.querySelector('.active-bubble');
      
      cinematic.addEventListener('scroll', function() {
        if (window.innerWidth > 600) return;
        var cardWidth = cinematic.children[0].offsetWidth;
        var index = Math.round(cinematic.scrollLeft / (cardWidth + 16));
        
        if (nums[index] && !nums[index].classList.contains('active')) {
          nums.forEach(function(n) { n.classList.remove('active'); });
          nums[index].classList.add('active');
          updateBubble(activeBubble, nums[index]);

          if (workflowTabsContainer) {
            var numOffset = nums[index].offsetLeft;
            var containerHalf = workflowTabsContainer.offsetWidth / 2;
            workflowTabsContainer.scrollTo({ left: numOffset - containerHalf + (nums[index].offsetWidth / 2), behavior: 'smooth' });
          }
        }
      }, { passive: true });
      
      nums.forEach(function(num, i) {
        num.addEventListener('click', function() {
          var cardWidth = cinematic.children[0].offsetWidth;
          cinematic.scrollTo({ left: i * (cardWidth + 16), behavior: 'smooth' });
        });
      });
    }

    if (reduceMotion) {
      steps.forEach(function (step) { step.classList.add('is-active'); });
      if (progress) progress.style.height = '100%';
      if (glow) glow.style.top = 'calc(100% - 60px)';
      return;
    }

    window.addEventListener('scroll', updateDesktop, { passive: true });
    window.addEventListener('resize', updateDesktop);
    updateDesktop();
  }

  function initSwipeHints() {
    var carousels = document.querySelectorAll('.works-grid, .timeline-cinematic');
    carousels.forEach(function (c) {
      var section = c.closest('section');
      if (!section) return;
      var hint = section.querySelector('.swipe-hint');
      
      c.addEventListener('scroll', function () {
        if (hint && c.scrollLeft > 20) {
          hint.classList.add('is-hidden');
        }
      }, { passive: true });

      var dotsContainer = section.querySelector('.works-indicators');
      if(dotsContainer) {
        var dots = dotsContainer.querySelectorAll('.dot');
        var items = c.children;
        if(dots.length && items.length) {
          c.addEventListener('scroll', function () {
            var cardWidth = items[0].offsetWidth;
            var index = Math.round((c.scrollLeft) / (cardWidth + 16));
            dots.forEach(function(d, i) {
              d.classList.toggle('active', i === index);
            });
          }, { passive: true });
        }
      }
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
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      if (!btn.classList.contains('is-revealed')) {
        e.preventDefault(); 
        btn.classList.add('is-revealed');
      }
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

  function initScrollSpy() {
    var desktopLinks = document.querySelectorAll('.desktop-nav-wrap .nav-item-desktop');
    if (!desktopLinks.length) return;
    
    var activeBubble = document.querySelector('.desktop-nav-wrap .active-bubble');

    window.addEventListener('scroll', function() {
      if (isClickScrolling) return; // Prevent "saltino al contrario"

      var scrollPos = window.scrollY + window.innerHeight / 3;
      var currentId = '';
      
      desktopLinks.forEach(function(link) {
        var section = document.querySelector(link.getAttribute('href'));
        if (section && section.offsetTop <= scrollPos) {
          currentId = link.getAttribute('href');
        }
      });
      
      if (currentId) {
        var activeLink = document.querySelector('.desktop-nav-wrap a[href="' + currentId + '"]');
        var currentActive = document.querySelector('.desktop-nav-wrap a.active');
        if (activeLink && activeLink !== currentActive) {
          if (currentActive) currentActive.classList.remove('active');
          activeLink.classList.add('active');
          
          if (activeBubble) {
            activeBubble.style.width = activeLink.offsetWidth + 'px';
            activeBubble.style.height = activeLink.offsetHeight + 'px';
            activeBubble.style.transform = 'translate(' + activeLink.offsetLeft + 'px, ' + activeLink.offsetTop + 'px)';
          }
        }
      }
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLanguage();
    initCursor();
    initAmbientMotion();
    initReveal();
    initMotionTabs();
    initTimeline();
    initSwipeHints();
    initMonitor();
    initLightbox();
    initPhoneReveal();
    initScrollSpy();
  });
})();