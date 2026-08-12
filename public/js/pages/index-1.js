  /* Navbar : effet de scroll */
  (function setupNavbarScroll() {
    var nav = document.getElementById('navbar');
    var ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          if (window.scrollY > 8) nav.classList.add('scrolled');
          else nav.classList.remove('scrolled');
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* Apparitions au scroll */
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
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* Compteurs animés — easing expo décéléré ; le suffixe (+ / m²) reste
     invisible pendant le comptage et se révèle en fondu à l'arrivée. */
  (function setupCounters() {
    var nodes = document.querySelectorAll('.chiffre-value[data-target]');
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!nodes.length || !('IntersectionObserver' in window) || reduceMotion) {
      nodes.forEach(function (n) { renderFinal(n, false); });
      return;
    }

    function suffixSpan(suffix, pending) {
      if (!suffix) return '';
      return '<span class="chiffre-suffix' + (pending ? ' chiffre-suffix--pending' : '') + '">' + suffix + '</span>';
    }

    function renderFinal(node, revealSuffix) {
      var target = parseInt(node.getAttribute('data-target'), 10);
      var suffix = node.getAttribute('data-suffix') || '';
      node.innerHTML = String(target) + suffixSpan(suffix, revealSuffix);
      if (revealSuffix && suffix) {
        var s = node.querySelector('.chiffre-suffix');
        void s.offsetWidth;   /* force le reflow : la transition opacity/transform se déclenche */
        s.classList.remove('chiffre-suffix--pending');
      }
    }

    function animate(node) {
      var target = parseInt(node.getAttribute('data-target'), 10);
      var suffix = node.getAttribute('data-suffix') || '';
      var duration = 1600;
      var start = performance.now();
      // Pour les années (> 1900), on démarre proche de la cible (effet bref).
      // Pour les autres valeurs, on démarre à 0 pour un compteur ample.
      var from = (target > 1900) ? Math.max(0, target - 50) : 0;

      function tick(now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        var current = Math.floor(from + (target - from) * eased);
        if (progress < 1) {
          node.innerHTML = String(current) + suffixSpan(suffix, true);
          requestAnimationFrame(tick);
        } else {
          renderFinal(node, true);
        }
      }
      requestAnimationFrame(tick);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animate(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });

    nodes.forEach(function (n) { io.observe(n); });
  })();

  /* Spotlight curseur sur les cards */
  (function setupCardSpotlight() {
    var cards = document.querySelectorAll('.pole-card');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  })();


  /* Année courante */
  (function setupYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
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

  /* ----------------------------------------------------
     [Refonte TOC v3 : bleed BG (.vl-bg) supprimé, remplacé
     par le SVG .toc-net en background-réseau. Plus rien à
     aligner dynamiquement — le réseau est ancré au container.]
     ---------------------------------------------------- */

  /* ----------------------------------------------------
     Reading guide TOC : la row centrée dans le viewport
     reçoit la classe .toc-row--focus (wash subtil + trail
     line à 42%, brightening textuel léger). Sortie smooth.
     IntersectionObserver avec rootMargin asymétrique pour
     viser la "ligne de lecture" légèrement au-dessus du
     centre. Honor prefers-reduced-motion.
     ---------------------------------------------------- */
  (function setupValeursDiagram() {
    var flow = document.querySelector('.vd-flow');
    if (!flow) return;
    flow.querySelectorAll('.vd-anim-line').forEach(function(el) {
      var len = el.getTotalLength();
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
    });
  })();

  /* ----------------------------------------------------
     Spotlight blanc cassé sur les cards "Valeurs" : suit la
     position du curseur (vars CSS --vlr-mx / --vlr-my).
     [Legacy : la TOC v2 n'utilise plus de cards, ce setup
     ne trouve plus de .valeur et fait early-return.]
     ---------------------------------------------------- */
  (function setupValeurSpotlight() {
    var cards = document.querySelectorAll('.valeur');
    if (!cards.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cards.forEach(function (card) {
      var raf = null;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var mx = ((e.clientX - r.left) / r.width) * 100;
        var my = ((e.clientY - r.top) / r.height) * 100;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.setProperty('--vlr-mx', mx.toFixed(2) + '%');
          card.style.setProperty('--vlr-my', my.toFixed(2) + '%');
        });
      });
    });
  })();

  /* === HISTOIRE — Reveal cascade par jalon ================================
     Chaque .hist-entry reçoit .is-revealed dès qu'elle entre dans le
     viewport. La cascade interne (branche tracée → nœud pop → typo
     fade-up stagger) est entièrement pilotée par les transition-delay
     définis en CSS. Fallback : si IntersectionObserver indisponible,
     on révèle tout immédiatement (pas d'animation, contenu visible). */
  (function setupHistReveal() {
    var network = document.getElementById('hist-network');
    if (!network) return;
    var entries = Array.prototype.slice.call(network.querySelectorAll('.hist-entry'));
    if (!entries.length) return;

    if (!('IntersectionObserver' in window)) {
      entries.forEach(function (e) { e.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(function (records) {
      records.forEach(function (r) {
        if (r.isIntersecting) {
          r.target.classList.add('is-revealed');
          io.unobserve(r.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.18 });
    entries.forEach(function (e) { io.observe(e); });
  })();

  /* === HISTOIRE → CTA — Flux de données scroll-driven =====================
     Une seule séquence couplée :
       (1) Pulse vertical 7-couleurs descend le tronc, démarrant au sommet
           du trunk (pas au top de la section : on saute l'overture).
       (2) Quand le pulse atteint le bas du trunk, l'orbital prend le
           relais et trace le contour du globe SVG, créant l'illusion
           d'une continuité ininterrompue du tronc → globe.
     rAF throttle pour ne pas saturer le main thread. Respecte
     prefers-reduced-motion (les éléments sont masqués CSS-side). */
  (function setupHistFlow() {
    var network = document.getElementById('hist-network');
    if (!network) return;
    var pulse  = network.querySelector('.hist-pulse');
    var cta    = document.getElementById('contact');
    /* Cascade CSS variables : on les pose sur les conteneurs respectifs.
       --orbit-dash / --orbit-offset sur .cta-orbit-pulse (halo + arc).
       --spine-pulse-fill sur .cta-spine-pulse (mask vertical).
       --globe-fill-opacity sur .cta-orbit-pulse (utilisé par .cta-globe-fill
       via JS direct car cousin, pas descendant). */
    var orbit      = cta ? cta.querySelector('.cta-orbit-pulse') : null;
    var spinePulse = cta ? cta.querySelector('.cta-spine-pulse') : null;
    var globeFill  = cta ? cta.querySelector('.cta-globe-fill')  : null;
    if (!pulse) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      pulse.style.display = 'none';
      if (orbit) orbit.style.display = 'none';
      if (spinePulse) spinePulse.style.display = 'none';
      if (globeFill) globeFill.style.display = 'none';
      return;
    }

    var pulseH = 340;          /* doit matcher .hist-pulse height en CSS */
    var ticking = false;

    function update() {
      ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;

      /* --- (1) Trunk pulse : parking au sommet du tronc, puis descend.
         Liftoff = délai avant le départ de la descente : le pulse reste
         visible au top du trunk pendant les premiers 18% de progress.
         La course est volontairement ralentie (multiplicateur 0.32) :
         le pulse reste visible plus tard dans le scroll, créant une
         transition plus douce avec l'animation orbitale du globe. */
      var rect = network.getBoundingClientRect();
      var range = rect.height + vh;
      var traveled = vh - rect.top;
      var progress = Math.max(0, Math.min(1, traveled / range));
      var pulseLiftoff = 0.18;
      var pulseProgress = Math.max(0, (progress - pulseLiftoff) / (1 - pulseLiftoff));
      /* Pulse sort du trunk plus tard (~0.93 de progress au lieu de 0.79).
         La traîne du gradient (top transparent) fait office de fade-out
         naturel à mesure que le pulse exit l'overflow:hidden de .histoire. */
      var pulseY = pulseProgress * (rect.height + pulseH * 0.32);
      pulse.style.setProperty('--pulse-y', pulseY.toFixed(1) + 'px');

      /* --- (2) Séquence CTA : spine-pulse → orbital → globe-fill.

         Phase 1 (ctaProgress 0 → 0.22) : SPINE-PULSE
           Le tracé vertical 7 couleurs se révèle progressivement du
           sommet du CTA au sommet du globe (mask-image animé).
           Aucune action sur l'orbital ni le fill pendant cette phase.

         Phase 2 (ctaProgress 0.22 → 0.78) : ORBITAL
           L'orbital décolle SEULEMENT après que le spine-pulse a
           atteint le sommet du globe. Diffusion smooth (ease-out
           cubic, power 1.7) et stroke-width réduit pour plus de
           discrétion. Couvre la moitié visible (demi-cercle = 50 unités).

         Phase 3 (ctaProgress 0.22 → 1) : GLOBE-FILL
           Croissance lente (ease-out subtil, power 1.3) pour que le
           globe soit pleinement couvert seulement en fin de scroll. */
      if (cta) {
        var ctaRect = cta.getBoundingClientRect();
        var ctaRange = ctaRect.height + vh;
        var ctaTraveled = vh - ctaRect.top;
        var ctaProgress = Math.max(0, Math.min(1, ctaTraveled / ctaRange));

        /* Phase 1 : Spine-pulse (fill 0 → 100% sur ctaProgress 0 → 0.22) */
        if (spinePulse) {
          var spineSpan = 0.22;
          var spineProgress = Math.max(0, Math.min(1, ctaProgress / spineSpan));
          /* Ease-out cubic léger : remplissage qui ralentit en approchant
             le sommet du globe. */
          var spineEased = 1 - Math.pow(1 - spineProgress, 1.8);
          spinePulse.style.setProperty('--spine-pulse-fill', (spineEased * 100).toFixed(1) + '%');
        }

        /* Phase 2 : Orbital — démarre quand spine-pulse est terminé */
        if (orbit) {
          var orbitLiftoff = 0.22;     /* AFTER spine-pulse completes */
          var orbitSpan = 0.56;         /* slower spread = smoother feel */
          var orbitProgress = Math.max(0, Math.min(1, (ctaProgress - orbitLiftoff) / orbitSpan));

          /* Garde-fou complétion : ctaProgress n'atteint jamais 1
             (le footer en-dessous empêche la section CTA de sortir
             complètement du viewport), donc orbitDash plafonnait sous
             50 → l'arc s'arrêtait quelques degrés avant l'horizon de
             chaque côté. On force la progression à 1 sur les 5 %
             finaux du scroll-document pour garantir un contour complet
             de la moitié visible exactement au bas de la page. */
          var docScrollMax = Math.max(1, (document.documentElement.scrollHeight || document.body.scrollHeight) - vh);
          var pageBottom = Math.max(0, Math.min(1, ((window.scrollY || window.pageYOffset) / docScrollMax - 0.95) / 0.05));
          orbitProgress = Math.max(orbitProgress, pageBottom);

          /* Ease-out cubic plus doux (power 1.7) pour un déploiement
             plus organique et moins agressif. */
          var orbitEased = 1 - Math.pow(1 - orbitProgress, 1.7);
          var orbitDash = orbitEased * 50;
          var orbitOffset = orbitDash / 2 - 100;
          orbit.style.setProperty('--orbit-dash', orbitDash.toFixed(2));
          orbit.style.setProperty('--orbit-offset', orbitOffset.toFixed(2));
        }

        /* Phase 3 : Globe-fill — croissance lente jusqu'à la fin */
        if (globeFill) {
          var fillLiftoff = 0.22;
          var fillProgress = Math.max(0, Math.min(1, (ctaProgress - fillLiftoff) / (1 - fillLiftoff)));
          /* Ease-out subtil (power 1.3) — démarre plus doucement,
             max opacity exactement à la fin du scroll. */
          var fillEased = 1 - Math.pow(1 - fillProgress, 1.3);
          globeFill.style.setProperty('--globe-fill-opacity', fillEased.toFixed(3));
        }
      }
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  })();
