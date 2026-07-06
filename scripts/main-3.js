(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var body = document.body;

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
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
        frameNode.insertBefore(iframe, closeBtnNode);
      }

      lightbox.setAttribute('aria-hidden', 'false');
      body.classList.add('lightbox-open');

      window.setTimeout(function () {
        closeBtnNode.focus();
      }, 60);
    }

    function close() {
      lightbox.setAttribute('aria-hidden', 'true');
      body.classList.remove('lightbox-open');
      clearFrame();
      if (lastFocused) lastFocused.focus();
    }

    triggers.forEach(function (trigger) {
      var thumb = trigger.querySelector('.work-thumb');
      if (thumb) {
        var thumbPath = thumb.getAttribute('data-thumb');
        if (thumbPath) {
          thumb.style.backgroundImage = 'url("./assets/works/' + thumbPath + '")';
        }
      }

      trigger.addEventListener('click', function () {
        open(trigger);
      });

      trigger.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(trigger);
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
    var btn = document.querySelector('.reveal-phone');
    var phoneWrap = document.getElementById('phone-number');
    if (!btn || !phoneWrap) return;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      phoneWrap.hidden = open;
      btn.textContent = open ? 'Click to reveal' : 'Hide number';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initTimeline();
    initLightbox();
    initPhoneReveal();
  });
})();
