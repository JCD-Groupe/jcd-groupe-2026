  (function setupRevealAnimations() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  (function setupYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  })();

  /* ----------------------------------------------------
     HERO — vidéo de fond : lecture auto, muette, en boucle.
     On force play() (certains navigateurs l'exigent même en
     muted) et on met en pause si prefers-reduced-motion.
     ---------------------------------------------------- */
  (function setupHeroVideo() {
    var video = document.getElementById('hero-video');
    if (!video) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var EVTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

    // Révélation premium : fondu + léger zoom. On n'attend PAS les données vidéo
    // (11 Mo) — sinon le cadre reste noir ~1,4 s à l'arrivée sur la page. Dès que
    // le poster (préchargé dans le <head>) est décodé, l'écran est rempli et la
    // vidéo prend le relais dessous, sur la même image : aucun à-coup visible.
    function revealVideo() { video.classList.add('is-ready'); }
    var posterSrc = video.getAttribute('poster');
    if (posterSrc) {
      var pre = new Image();
      pre.src = posterSrc;
      if (pre.decode) pre.decode().then(revealVideo, revealVideo);
      else { pre.onload = revealVideo; pre.onerror = revealVideo; }
    }
    if (video.readyState >= 2) revealVideo();
    window.setTimeout(revealVideo, 700); // filet de sécurité si le poster traîne

    function resumeOnGesture() {
      function go() {
        video.muted = true;
        video.play().catch(function () {});
        EVTS.forEach(function (e) { window.removeEventListener(e, go); });
      }
      EVTS.forEach(function (e) { window.addEventListener(e, go, { once: true, passive: true }); });
    }

    function apply() {
      if (reduce.matches) {
        video.pause();
        return;
      }
      video.muted = true;              // obligatoire pour l'autoplay
      var p = video.play();
      // Si l'autoplay est refusé (politique navigateur), on relance au 1er geste.
      if (p && p.catch) p.catch(resumeOnGesture);
    }

    if (video.readyState >= 1) apply();
    else video.addEventListener('loadedmetadata', apply, { once: true });

    // Relance si la lecture est interrompue (retour d'onglet, économie d'énergie…)
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && !reduce.matches && video.paused) apply();
    });
    if (reduce.addEventListener) reduce.addEventListener('change', apply);
    else if (reduce.addListener) reduce.addListener(apply);
  })();

  (function setupNavbarScrolled() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;
    function onScroll() {
      navbar.classList.toggle('scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ----------------------------------------------------
     NAVBAR v2 — Dropdown "Expertises"
     ---------------------------------------------------- */
  (function setupNavDropdown() {
    var trigger = document.getElementById('nav-expertises-trigger');
    var panel   = document.getElementById('nav-expertises-panel');
    var pill    = document.getElementById('nav-pill');
    var navbar  = document.getElementById('navbar');
    if (!trigger || !panel || !pill || !navbar) return;

    var items  = panel.querySelectorAll('.nm-item, .nm-sub-item');
    var groups = panel.querySelectorAll('.nm-group');
    var openTimer = null;
    var closeTimer = null;
    var isOpen = false;

    function clearTimers() {
      if (openTimer)  { window.clearTimeout(openTimer);  openTimer = null;  }
      if (closeTimer) { window.clearTimeout(closeTimer); closeTimer = null; }
    }

    function openPanel() {
      clearTimers();
      if (isOpen) return;
      isOpen = true;
      trigger.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
      items.forEach(function (it) { it.setAttribute('tabindex', '0'); });
    }
    function closePanel() {
      clearTimers();
      if (!isOpen) return;
      isOpen = false;
      trigger.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      items.forEach(function (it) { it.setAttribute('tabindex', '-1'); });
      groups.forEach(function (g) { g.setAttribute('data-expanded', 'false'); });
    }
    function deferOpen()  { clearTimers(); openTimer  = window.setTimeout(openPanel,  60);  }
    function deferClose() { clearTimers(); closeTimer = window.setTimeout(closePanel, 180); }

    [trigger, pill, panel].forEach(function (el) {
      el.addEventListener('mouseenter', function () { deferOpen();  });
      el.addEventListener('mouseleave', function () { deferClose(); });
    });

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (isOpen) closePanel();
      else openPanel();
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPanel();
        if (items.length) items[0].focus();
      } else if (e.key === 'Escape' && isOpen) {
        closePanel();
        trigger.focus();
      }
    });

    items.forEach(function (item, i) {
      item.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          items[(i + 1) % items.length].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          items[(i - 1 + items.length) % items.length].focus();
        } else if (e.key === 'Escape') {
          closePanel();
          trigger.focus();
        } else if (e.key === 'Tab' && !e.shiftKey && i === items.length - 1) {
          closePanel();
        } else if (e.key === 'Tab' && e.shiftKey && i === 0) {
          closePanel();
        }
      });
    });

    document.addEventListener('click', function (e) {
      if (!isOpen) return;
      if (navbar.contains(e.target)) return;
      closePanel();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
        trigger.focus();
      }
    });

    var grpTimer = null;
    function setExpanded(target) {
      if (grpTimer) { clearTimeout(grpTimer); grpTimer = null; }
      groups.forEach(function (g) {
        g.setAttribute('data-expanded', g === target ? 'true' : 'false');
      });
    }
    groups.forEach(function (group) {
      var hasSub = !!group.querySelector('.nm-sub');
      group.addEventListener('mouseenter', function () {
        if (grpTimer) { clearTimeout(grpTimer); grpTimer = null; }
        grpTimer = setTimeout(function () {
          setExpanded(hasSub ? group : null);
        }, 70);
      });
      group.addEventListener('focusin', function () {
        setExpanded(hasSub ? group : null);
      });
    });

    var here = (location.pathname.split('/').pop() || '').toLowerCase();
    if (!here) here = 'index.html';
    panel.querySelectorAll('.nm-zone--expertises .nm-item').forEach(function (a) {
      var hrefAttr = a.getAttribute('href') || '';
      if (hrefAttr.indexOf('#') !== -1) return;
      var target = hrefAttr.split('/').pop().toLowerCase();
      if (target && target === here) a.classList.add('is-current');
    });
    panel.querySelectorAll('.nm-sub-item').forEach(function (s) {
      var st = (s.getAttribute('href') || '').split('/').pop().toLowerCase();
      if (st && st === here) s.classList.add('is-current');
    });
  })();
