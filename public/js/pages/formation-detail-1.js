  /* ---- Reveal on scroll ---- */
  (function setupRevealAnimations() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---- Year ---- */
  (function () {
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  })();

  

  /* ---- Navbar scroll class ---- */
  (function () {
    var nb = document.getElementById('navbar');
    if (!nb) return;
    var last = 0;
    function check() {
      var y = window.scrollY || window.pageYOffset;
      if (y > 24 && last <= 24) nb.classList.add('scrolled');
      else if (y <= 24 && last > 24) nb.classList.remove('scrolled');
      last = y;
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  })();

  

  /* ---- Fil de progression de lecture ---- */
  (function setupScrollProgress() {
    var bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, (window.scrollY || 0) / max)) : 0;
      bar.style.setProperty('--sp', p.toFixed(4));
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ---- Spotlight curseur sur les blocs ---- */
  (function setupSpotlight() {
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.fd-card, .fd-certif').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left).toFixed(1) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top).toFixed(1) + 'px');
      });
    });
  })();

  /* ---- Accordéon programme + "tout déplier" ---- */
  (function setupProgramAccordion() {
    var mods = Array.prototype.slice.call(document.querySelectorAll('.fd-mod'));
    mods.forEach(function (mod) {
      var btn = mod.querySelector('.fd-mod-btn');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = mod.getAttribute('data-open') === 'true';
        mod.setAttribute('data-open', String(!open));
        btn.setAttribute('aria-expanded', String(!open));
        syncExpandAll();
      });
    });
    var all = document.getElementById('fd-expand');
    function syncExpandAll() {
      if (!all) return;
      var everyOpen = mods.every(function (m) { return m.getAttribute('data-open') === 'true'; });
      all.setAttribute('data-open', String(everyOpen));
      var tx = all.querySelector('.fd-expand-tx');
      if (tx) tx.textContent = everyOpen ? 'Tout replier' : 'Tout déplier';
    }
    if (all) {
      all.addEventListener('click', function () {
        var target = all.getAttribute('data-open') !== 'true';
        mods.forEach(function (m) {
          m.setAttribute('data-open', String(target));
          var b = m.querySelector('.fd-mod-btn');
          if (b) b.setAttribute('aria-expanded', String(target));
        });
        syncExpandAll();
      });
    }
  })();

  /* ---- Sommaire scroll-spy ---- */
  (function setupTocSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.fd-toc-item'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (l) { map[l.getAttribute('data-spy')] = l; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var link = map[en.target.id];
        if (!link) return;
        links.forEach(function (l) { l.classList.toggle('is-active', l === link); });
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  })();

  /* ---- Hydratation depuis le catalogue (?f=<slug>&cat=<slug>) ----
     Provisoire : renseigne titre, catégorie, teinte et liens depuis
     l'index embarqué. Le contenu détaillé (programme, tarifs…) sera
     servi par Directus (collection formations). ---- */
  (function hydrateFromCatalogue() {
    var holder = document.getElementById('jcd-catalogue-index');
    if (!holder) return;
    var index;
    try { index = JSON.parse(holder.textContent); } catch (e) { return; }
    var params = new URLSearchParams(window.location.search);
    var f = params.get('f');
    var cat = params.get('cat');
    if (!f || !index[f]) return;
    var entries = index[f];
    var e = null;
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].s === cat) { e = entries[i]; break; }
    }
    if (!e) e = entries[0];

    document.title = e.t + ' · Formation · JCD Groupe';
    document.documentElement.style.setProperty('--cat', e.rgb);

    document.querySelectorAll('[data-field="title"]').forEach(function (n) { n.textContent = e.t; });
    document.querySelectorAll('[data-field="categorie"]').forEach(function (n) {
      n.textContent = e.c;
      if (n.tagName === 'A') n.setAttribute('href', e.p);
    });
    /* Champs spécifiques à l'exemple type : neutralisés tant que
       Directus ne fournit pas la vraie valeur. */
    if (f !== 'excel-initiation') {
      document.querySelectorAll('[data-field="reference"]').forEach(function (n) { n.textContent = '—'; });
    }
    var devis = document.getElementById('fd-cta-devis');
    if (devis) devis.setAttribute('href', 'contact.html?pole=formation&formation=' + encodeURIComponent(f));
  })();

  /* ---- Navbar dropdown ---- */
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
      window.__jcdNavClosers.forEach(function (fn) { if (fn !== closePanel) fn(); });
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
    /* Registre partagé : un seul panneau de nav ouvert à la fois. */
    window.__jcdNavClosers = window.__jcdNavClosers || [];
    window.__jcdNavClosers.push(closePanel);
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
           contient un .nm-sub). Hoverer un autre groupe replie le
           precedent. Reset complet a la fermeture du panneau. === */
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

    /* === Marqueur de page courante : ajoute .is-current sur l'item
           expertise dont le href pointe vers le fichier courant.
           Les items de la zone Decouvrir (anchors) ne sont jamais
           marques courants. === */
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


  /* ---- Mega menu Catalogue ---- */
  (function setupCatalogueMenu() {
    var trigger = document.getElementById('nav-catalogue-trigger');
    var panel   = document.getElementById('nav-catalogue-panel');
    var pill    = document.getElementById('nav-catalogue-pill');
    var navbar  = document.getElementById('navbar');
    if (!trigger || !panel || !pill || !navbar) return;

    var body    = panel.querySelector('.ncat-body');
    var search  = panel.querySelector('.ncat-search');
    var input   = panel.querySelector('.ncat-input');
    var cats    = Array.prototype.slice.call(panel.querySelectorAll('.ncat-cat'));
    var groups  = Array.prototype.slice.call(panel.querySelectorAll('.ncat-group'));
    var items   = Array.prototype.slice.call(panel.querySelectorAll('.ncat-item'));
    var focusables = Array.prototype.slice.call(
      panel.querySelectorAll('.ncat-cat, .ncat-item, .ncat-group-all, .ncat-foot-cta, .ncat-void-reset')
    );

    var openTimer = null, closeTimer = null, hoverTimer = null, isOpen = false;

    /* Index de recherche : libellés normalisés sans accents. */
    function fold(s) {
      return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }
    items.forEach(function (it) { it.setAttribute('data-q', fold(it.textContent)); });

    function setTabbable(on) {
      focusables.forEach(function (el) { el.setAttribute('tabindex', on ? '0' : '-1'); });
      if (input) input.setAttribute('tabindex', on ? '0' : '-1');
    }
    setTabbable(false);

    function clearTimers() {
      if (openTimer)  { window.clearTimeout(openTimer);  openTimer = null;  }
      if (closeTimer) { window.clearTimeout(closeTimer); closeTimer = null; }
    }

    window.__jcdNavClosers = window.__jcdNavClosers || [];

    function openPanel() {
      clearTimers();
      if (isOpen) return;
      isOpen = true;
      window.__jcdNavClosers.forEach(function (fn) { if (fn !== closePanel) fn(); });
      trigger.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
      setTabbable(true);
    }
    function closePanel() {
      clearTimers();
      if (!isOpen) return;
      isOpen = false;
      trigger.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      resetSearch();
      setTabbable(false);
    }
    window.__jcdNavClosers.push(closePanel);

    function deferOpen()  { clearTimers(); openTimer  = window.setTimeout(openPanel,  60);  }
    function deferClose() { clearTimers(); closeTimer = window.setTimeout(closePanel, 180); }

    [pill, panel].forEach(function (el) {
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
        if (input) input.focus();
      } else if (e.key === 'Escape' && isOpen) {
        closePanel();
        trigger.focus();
      }
    });

    /* — Sélection de catégorie (survol ou focus du rail) — */
    function activate(slug) {
      cats.forEach(function (c) { c.setAttribute('aria-selected', String(c.getAttribute('data-cat') === slug)); });
      groups.forEach(function (g) { g.classList.toggle('is-active', g.getAttribute('data-cat') === slug); });
    }
    cats.forEach(function (cat) {
      cat.addEventListener('mouseenter', function () {
        if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
        hoverTimer = setTimeout(function () { activate(cat.getAttribute('data-cat')); }, 55);
      });
      cat.addEventListener('focus', function () { activate(cat.getAttribute('data-cat')); });
    });

    /* — Recherche instantanée plein catalogue — */
    function applySearch(qRaw) {
      var q = fold(qRaw.trim());
      var hits = 0;
      if (search) search.classList.toggle('has-query', q.length > 0);
      if (!q) {
        body.classList.remove('is-searching', 'no-results');
        items.forEach(function (it) { it.removeAttribute('hidden'); });
        groups.forEach(function (g) { g.removeAttribute('data-empty'); });
        return;
      }
      body.classList.add('is-searching');
      var terms = q.split(/\s+/);
      groups.forEach(function (g) {
        var any = false;
        g.querySelectorAll('.ncat-item').forEach(function (it) {
          var hay = it.getAttribute('data-q') || '';
          var ok = terms.every(function (t) { return hay.indexOf(t) !== -1; });
          if (ok) { it.removeAttribute('hidden'); any = true; hits++; }
          else { it.setAttribute('hidden', ''); }
        });
        g.setAttribute('data-empty', any ? 'false' : 'true');
      });
      body.classList.toggle('no-results', hits === 0);
    }
    function resetSearch() {
      if (!input) return;
      input.value = '';
      applySearch('');
    }
    if (input) {
      input.addEventListener('input', function () { applySearch(input.value); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          if (input.value) {
            e.stopPropagation();
            resetSearch();
          } else {
            closePanel();
            trigger.focus();
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (body.classList.contains('is-searching')) {
            var first = panel.querySelector('.ncat-item:not([hidden])');
            if (first) first.click();
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          var next = body.classList.contains('is-searching')
            ? panel.querySelector('.ncat-item:not([hidden])')
            : cats[0];
          if (next) next.focus();
        }
      });
    }
    var voidReset = panel.querySelector('.ncat-void-reset');
    if (voidReset) {
      voidReset.addEventListener('click', function () {
        resetSearch();
        if (input) input.focus();
      });
    }

    /* — Navigation clavier : rail vertical, flèche droite vers la
         scène, flèche gauche pour revenir au rail. — */
    cats.forEach(function (cat, i) {
      cat.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          cats[(i + 1) % cats.length].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          cats[(i - 1 + cats.length) % cats.length].focus();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          var g = panel.querySelector('.ncat-group.is-active .ncat-item:not([hidden])');
          if (g) g.focus();
        } else if (e.key === 'Escape') {
          closePanel();
          trigger.focus();
        }
      });
    });
    items.forEach(function (item) {
      item.addEventListener('keydown', function (e) {
        var visible = items.filter(function (it) { return !it.hasAttribute('hidden') && it.offsetParent !== null; });
        var idx = visible.indexOf(item);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (visible.length) visible[(idx + 1) % visible.length].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (visible.length) visible[(idx - 1 + visible.length) % visible.length].focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          var current = panel.querySelector('.ncat-cat[aria-selected="true"]') || cats[0];
          current.focus();
        } else if (e.key === 'Escape') {
          closePanel();
          trigger.focus();
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

    /* — Raccourci « / » : focus la recherche locale si la page en a
         une (pages catégories), sinon ouvre le catalogue et focus
         sa recherche. Ignoré pendant une saisie. — */
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      var local = document.getElementById('ct-search');
      if (local) { local.focus(); local.select(); return; }
      openPanel();
      if (input) window.setTimeout(function () { input.focus(); }, 90);
    });

    /* — Marqueur de catégorie courante (pages formation-*.html) — */
    var here = (location.pathname.split('/').pop() || '').toLowerCase();
    cats.forEach(function (c) {
      var target = (c.getAttribute('href') || '').split('/').pop().toLowerCase();
      if (target && target === here) {
        c.classList.add('is-current');
        activate(c.getAttribute('data-cat'));
      }
    });
  })();
