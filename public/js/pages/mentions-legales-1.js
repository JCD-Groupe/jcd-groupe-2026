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

  /* ---- Accordéons (repris de carrieres) ----
     Anime la hauteur de .acc-a + bascule aria-expanded. Un item peut
     démarrer ouvert (aria-expanded="true") : on cale alors sa hauteur
     à 'auto' au chargement pour que la 1re fermeture parte d'une
     hauteur mesurable. */
  (function setupAccordions() {
    var questions = document.querySelectorAll('.acc-q');
    Array.prototype.forEach.call(questions, function (q) {
      var item = q.closest('.acc-item');
      var panel = item ? item.querySelector('.acc-a') : null;
      if (!panel) return;
      if (q.getAttribute('aria-expanded') === 'true') {
        panel.style.height = 'auto';
      }
      q.addEventListener('click', function () {
        var isOpen = q.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          panel.style.height = panel.scrollHeight + 'px';
          void panel.offsetHeight;
          panel.style.height = '0px';
          q.setAttribute('aria-expanded', 'false');
        } else {
          q.setAttribute('aria-expanded', 'true');
          panel.style.height = panel.scrollHeight + 'px';
          var done = function () {
            if (q.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
            panel.removeEventListener('transitionend', done);
          };
          panel.addEventListener('transitionend', done);
        }
      });
    });
  })();

  /* ----------------------------------------------------
     NAVBAR v2 — Dropdown "Expertises"
     Ouverture sur hover (zone trigger + zone pill + zone
     panel, sans gap mort), focus clavier, clic, Esc, clic
     extérieur. Pilote aria-expanded + aria-hidden + classe
     .is-open pour les transitions CSS. Synchronisé pour le
     tab navigation entre items du panel.
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

    /* === Accordeon : sous-items d'Informatique (et tout groupe qui
           contient un .nm-sub). Survoler un autre groupe ne replie pas
           le sous-menu : il reste deploye tant que le curseur est dans
           le menu, et se replie avec le panneau a sa fermeture. === */
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
        if (!hasSub) return;
        grpTimer = setTimeout(function () {
          setExpanded(group);
        }, 70);
      });
      group.addEventListener('focusin', function () {
        if (hasSub) setExpanded(group);
      });
    });

    /* === Marqueur de page courante : ajoute .is-current sur l'item
           expertise dont le href pointe vers le fichier courant.
           Les items de la zone Decouvrir (anchors) ne sont jamais
           marques courants. === */
    var here = (location.pathname.split('/').pop() || '').toLowerCase();
    if (!here) here = "index";
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
