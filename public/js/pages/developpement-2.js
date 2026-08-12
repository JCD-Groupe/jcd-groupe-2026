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

  /* ----------------------------------------------------
     RÉALISATIONS — filtrage par type (multi-catégories)
     Boutons natifs : aria-pressed reflète l'état actif.
     Une carte s'affiche si le filtre est "all" ou si sa
     liste data-cat contient la valeur du filtre.
     ---------------------------------------------------- */
  (function setupRealisationsFilter() {
    var grid = document.getElementById('real-grid');
    if (!grid) return;
    var filters = Array.prototype.slice.call(document.querySelectorAll('.real-filter'));
    var cards   = Array.prototype.slice.call(grid.querySelectorAll('.real-card'));
    var live    = document.getElementById('real-live');
    var prev    = document.getElementById('real-prev');
    var next    = document.getElementById('real-next');
    var counter = document.getElementById('real-counter');
    if (!cards.length) return;

    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function visibleCards() {
      return cards.filter(function (c) { return !c.classList.contains('is-hidden'); });
    }
    function step() {
      var vis = visibleCards();
      if (!vis.length) return grid.clientWidth || 1;
      var gap = parseFloat(getComputedStyle(grid).columnGap || getComputedStyle(grid).gap) || 20;
      return vis[0].getBoundingClientRect().width + gap;
    }
    function update() {
      var total = visibleCards().length;
      var s = step();
      var cur = Math.min(Math.round(grid.scrollLeft / s) + 1, total);
      if (total < 1) cur = 0;
      if (counter) counter.innerHTML = '<b>' + pad2(cur) + '</b> / ' + pad2(total);
      var atStart = grid.scrollLeft <= 2;
      var atEnd   = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 2;
      if (prev) prev.disabled = atStart;
      if (next) next.disabled = atEnd;
    }
    function go(dir) {
      var s = step();
      var target = Math.round(grid.scrollLeft / s) * s + dir * s;
      var max = grid.scrollWidth - grid.clientWidth;
      if (target < 0) target = 0; else if (target > max) target = max;
      grid.scrollTo({ left: target, behavior: 'smooth' });
    }
    function rafUpdate() { window.requestAnimationFrame(update); }

    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    grid.addEventListener('scroll', rafUpdate, { passive: true });
    grid.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    /* Drag à la souris/trackpad/tactile */
    var down = false, startX = 0, startLeft = 0, moved = false;
    grid.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = grid.scrollLeft;
      grid.classList.add('is-dragging');
    });
    grid.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      grid.scrollLeft = startLeft - dx;
    });
    function endDrag() {
      if (!down) return;
      down = false; grid.classList.remove('is-dragging');
      /* re-snap à la carte la plus proche après un drag libre */
      var s = step();
      grid.scrollTo({ left: Math.round(grid.scrollLeft / s) * s, behavior: 'smooth' });
    }
    grid.addEventListener('pointerup', endDrag);
    grid.addEventListener('pointercancel', endDrag);
    grid.addEventListener('pointerleave', endDrag);
    /* un drag ne doit pas déclencher le clic de la carte */
    grid.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    function apply(value) {
      var shown = 0;
      cards.forEach(function (card) {
        var cats = (card.getAttribute('data-cat') || '').split(' ');
        var match = value === 'all' || cats.indexOf(value) !== -1;
        if (match) {
          card.classList.remove('is-hidden');
          card.classList.remove('is-in');
          void card.offsetWidth; /* reflow : relance l'animation d'entrée */
          card.classList.add('is-in');
          shown++;
        } else {
          card.classList.add('is-hidden');
        }
      });
      if (live) { live.textContent = shown + (shown > 1 ? ' projets affichés' : ' projet affiché'); }
      grid.scrollTo({ left: 0, behavior: 'auto' }); /* repeuple → retour au début */
      rafUpdate();
    }

    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        apply(btn.getAttribute('data-filter'));
      });
    });

    window.addEventListener('resize', rafUpdate, { passive: true });
    update();
  })();

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

  /* ---- Navbar : classe .scrolled ---- */
  (function setupNavScroll() {
    var nb = document.getElementById('navbar');
    if (!nb) return;
    function check() {
      if ((window.scrollY || window.pageYOffset || 0) > 24) nb.classList.add('scrolled');
      else nb.classList.remove('scrolled');
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  })();

  /* ---- Logos clients : nom lisible au hover (alt -> data-name) ---- */
  (function () {
    document.querySelectorAll('.logo-marquee-item').forEach(function (item) {
      var img = item.querySelector('img');
      if (img && img.alt) item.setAttribute('data-name', img.alt);
    });
  })();

  /* ---- Hero WebGL — nappe d'or animée (aurora) ---- */
  (function setupHeroMesh() {
    var canvas = document.getElementById('heroMesh');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var gl = null;
    try {
      var opts = { antialias: false, alpha: false, premultipliedAlpha: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power' };
      gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    } catch (e) {}
    if (!gl) return;

    var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FRAG = [
      'precision highp float;',
      'uniform vec2  u_res;',
      'uniform float u_t;',
      'uniform vec3  u_c1;',
      'uniform vec3  u_c2;',
      'uniform vec3  u_c3;',
      'uniform vec3  u_c4;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
      'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);float a=hash(i);float b=hash(i+vec2(1.,0.));float c=hash(i+vec2(0.,1.));float d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
      'float fbm(vec2 p){float v=0.;float a=.55;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.04;a*=.52;}return v;}',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/u_res.xy;',
      '  vec2 p=uv*2.-1.; p.x*=u_res.x/u_res.y;',
      /* tempo très lent = sensation premium */
      '  float t=u_t*.035;',
      /* deux champs de bruit basse fréquence pour une variation ultra douce */
      '  float n1=fbm(p*0.5+vec2(t*0.45,t*0.26));',
      '  float n2=fbm(p*0.9+vec2(-t*0.3,t*0.18)+n1*0.4);',
      /* halo monochrome large, ancré en haut, respiration lente */
      '  vec2 a1=vec2(-0.05+0.10*sin(t*0.55), 0.6+0.05*cos(t*0.5));',
      '  float d1=length((p-a1)*vec2(0.60,0.95));',
      '  float g1=smoothstep(2.1,0.0,d1); g1*=g1; g1*=mix(0.72,1.0,n1);',
      /* wash ambiant gris, très étendu et lisse */
      '  float amb=smoothstep(1.85,-0.2,length(p*vec2(0.70,0.9)))*mix(0.7,1.0,n2);',
      /* composition strictement monochrome : base sombre → gris → blanc */
      '  vec3 col=u_c1;',
      '  col=mix(col,u_c2,g1*0.16+amb*0.06);',
      '  col=mix(col,u_c4,pow(g1,2.6)*0.085);',
      /* grain fin */
      '  col+=vec3((hash(gl_FragCoord.xy+u_t)-.5)*.009);',
      /* vignette très douce */
      '  float vig=1.-smoothstep(.5,1.7,length(p*vec2(0.58,0.85)));',
      '  col*=mix(.66,1.,vig);',
      '  col=pow(max(col,0.),vec3(.95));',
      '  gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
      return s;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var aLoc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, 'u_res');
    var uT   = gl.getUniformLocation(prog, 'u_t');
    var uC1  = gl.getUniformLocation(prog, 'u_c1');
    var uC2  = gl.getUniformLocation(prog, 'u_c2');
    var uC3  = gl.getUniformLocation(prog, 'u_c3');
    var uC4  = gl.getUniformLocation(prog, 'u_c4');

    function readMeshColor(host, name, fallback) {
      var raw = getComputedStyle(host).getPropertyValue('--mesh-' + name).trim();
      if (!raw) return fallback;
      var parts = raw.split(',').map(function (n) { return parseFloat(n) / 255; });
      if (parts.length !== 3 || parts.some(function (v) { return isNaN(v); })) return fallback;
      return parts;
    }
    var host = canvas.closest('.print-hero') || canvas.parentElement;
    gl.uniform3fv(uC1, readMeshColor(host, 'c1', [0.051, 0.051, 0.051]));
    gl.uniform3fv(uC2, readMeshColor(host, 'c2', [0.588, 0.588, 0.588]));
    gl.uniform3fv(uC3, readMeshColor(host, 'c3', [0.314, 0.314, 0.314]));
    gl.uniform3fv(uC4, readMeshColor(host, 'c4', [0.941, 0.941, 0.941]));

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, (window.innerWidth<=820?1.0:1.5));
      var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize, { passive: true });

    var running = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { running = entries[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
    }
    canvas.classList.add('is-ready');
    var start = performance.now();
    function frame(now) {
      if (running) {
        gl.uniform1f(uT, (now - start) / 1000);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ---- Hero : champ ASCII gravé — positions figées, glyphes qui mutent ---- */
  (function setupHeroAscii() {
    var c = document.getElementById('heroAscii');
    if (!c) return;
    var ctx = c.getContext('2d');
    if (!ctx) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr = Math.min(window.devicePixelRatio || 1, (window.innerWidth<=820?1.0:2));
    var PUNCT = '/:;{}<>=()[].'; /* symboles de code, minoritaires (pas de lettres) */
    var cells = [], W = 0, H = 0, FS = 13;
    function glyph() {
      if (Math.random() < 0.86) return Math.random() < 0.5 ? '0' : '1';
      return PUNCT.charAt(Math.floor(Math.random() * PUNCT.length));
    }
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

    /* Construit le champ FIGÉ : positions + alpha (vignette radiale + fondu
       derrière le titre) calculés une seule fois. Seuls les glyphes muteront. */
    function build() {
      W = Math.max(1, c.clientWidth); H = Math.max(1, c.clientHeight);
      c.width = Math.floor(W * dpr); c.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.textBaseline = 'top';
      var cw = FS * 1.18, chh = FS * 1.58;
      var cols = Math.ceil(W / cw) + 1, rows = Math.ceil(H / chh) + 1;
      var tcx = 0.40, tcy = 0.50, trx = 0.34, tryy = 0.21; /* ellipse du titre */
      cells = [];
      for (var r = 0; r < rows; r++) {
        for (var cc = 0; cc < cols; cc++) {
          if (Math.random() < (window.innerWidth<=820?0.60:0.46)) continue; /* densité ~54 % */
          var x = cc * cw, y = r * chh, nx = x / W, ny = y / H;
          var dxr = (nx - 0.5) / 0.62, dyr = (ny - 0.5) / 0.60;
          var vig = 1 - clamp(Math.sqrt(dxr * dxr + dyr * dyr), 0, 1); vig *= vig;
          var tx = (nx - tcx) / trx, ty = (ny - tcy) / tryy, td = Math.sqrt(tx * tx + ty * ty);
          var titleFade = td < 1 ? (0.18 + 0.82 * td) : 1;
          var a = (0.06 + Math.random() * 0.085) * vig * titleFade;
          if (a < 0.012) continue;
          cells.push({ x: x, y: y, a: a, ch: glyph() });
        }
      }
    }
    function render() {
      ctx.clearRect(0, 0, W, H);
      ctx.font = '500 ' + FS + 'px "JetBrains Mono", ui-monospace, monospace';
      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        ctx.fillStyle = 'rgba(236,236,236,' + cell.a.toFixed(3) + ')';
        ctx.fillText(cell.ch, cell.x, cell.y);
      }
    }
    build(); render();

    if (window.ResizeObserver) {
      var rt = null;
      new ResizeObserver(function () { if (rt) clearTimeout(rt); rt = setTimeout(function () { build(); render(); }, 120); }).observe(c);
    } else {
      window.addEventListener('resize', function () { build(); render(); }, { passive: true });
    }

    if (reduce) return; /* aucune mutation en mouvement réduit */

    /* Mutation : par petites touches, des glyphes se transforment (0↔1↔symboles)
       sans bouger. Cadence lente → texture vivante mais discrète. */
    var running = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { running = e[0].isIntersecting; }, { threshold: 0 }).observe(c);
    }
    var last = performance.now(), acc = 0, STEP = 48;
    function loop(now) {
      var dt = now - last; last = now;
      if (running) {
        acc += dt;
        if (acc >= STEP) {
          acc = 0;
          var n = cells.length, batch = Math.max(1, Math.round(n * 0.055));
          for (var b = 0; b < batch; b++) {
            var idx = (Math.random() * n) | 0;
            if (cells[idx]) cells[idx].ch = glyph();
          }
          render();
        }
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  /* ---- Hero : scintillement de la grille (cases qui fondent vers le jaune) ---- */
  (function setupHeroGrid() {
    var c = document.getElementById('heroGrid');
    if (!c) return;
    var ctx = c.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var dpr = Math.min(window.devicePixelRatio || 1, (window.innerWidth<=820?1.0:2));
    var CELL = 44, W = 1, H = 1, vx = [], hy = [], pulses = [];
    /* favorise les lignes centrales (0 aux bords, 1 au centre) */
    function bias(t) { return 1 - Math.abs(t - 0.5) * 1.5; }
    function spawn(prime) {
      var horiz = Math.random() < 0.5;
      var lines = horiz ? hy : vx, dim = horiz ? H : W, span = horiz ? W : H;
      if (!lines.length) return;
      var lc = lines[Math.floor(Math.random() * lines.length)];
      /* une seule traînée à la fois par ligne : on rejette une ligne déjà occupée */
      for (var j = 0; j < pulses.length; j++) if (pulses[j].h === horiz && pulses[j].c === lc) return;
      var accept = Math.max(0.14, bias(lc / dim)); /* densité centrale */
      /* peu de tracés horizontaux au niveau de la baseline du hero (bande du titre) */
      if (horiz) { var ty = lc / dim; if (ty > 0.30 && ty < 0.66) accept *= 0.12; }
      if (Math.random() > accept) return;
      var dir = Math.random() < 0.5 ? 1 : -1;
      var len = 120 + Math.random() * 160;   /* tracés un peu plus longs */
      var sp = 72 + Math.random() * 92;        /* un peu plus lents */
      var pos = prime ? Math.random() * span : (dir > 0 ? -len : span + len);
      pulses.push({ h: horiz, c: lc, pos: pos, dir: dir, len: len, sp: sp, peak: 0.26 + Math.random() * 0.16 });
    }
    function render() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 1; ctx.lineCap = 'round';
      for (var i = 0; i < pulses.length; i++) {
        var p = pulses[i], x1, y1, x2, y2;
        if (p.h) { y1 = y2 = p.c; x2 = p.pos; x1 = p.pos - p.dir * p.len; }
        else { x1 = x2 = p.c; y2 = p.pos; y1 = p.pos - p.dir * p.len; }
        var g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, 'rgba(249,214,5,0)');
        g.addColorStop(0.45, 'rgba(249,214,5,' + (p.peak * 0.12).toFixed(3) + ')'); /* longue traîne douce */
        g.addColorStop(0.82, 'rgba(249,214,5,' + (p.peak * 0.6).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(249,214,5,' + p.peak.toFixed(3) + ')');
        ctx.strokeStyle = g;
        ctx.lineWidth = 3.0; ctx.globalAlpha = 0.28; /* halo doux */
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.lineWidth = 1.3; ctx.globalAlpha = 0.82; /* trait net + légère transparence */
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    function resize() {
      W = Math.max(1, c.clientWidth); H = Math.max(1, c.clientHeight);
      c.width = Math.floor(W * dpr); c.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* positions des lignes alignées sur la grille CSS (44px ; vertic. centrées, horiz. depuis le haut) */
      /* lignes EXACTEMENT alignées sur la grille CSS (background-position: center top) :
         verticales centrées (réf. = W/2 - CELL/2), horizontales depuis le haut */
      vx = []; var sx = (((W / 2 - CELL / 2) % CELL) + CELL) % CELL; for (var x = sx; x <= W; x += CELL) vx.push(x);
      hy = []; for (var y = 0; y <= H; y += CELL) hy.push(y);
      pulses = [];
      for (var k = 0; k < 10; k++) spawn(true); /* amorce : flux déjà en cours (moins nombreux) */
      render(); /* premier rendu synchrone (avant que le rAF ne démarre) */
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(c);
    else window.addEventListener('resize', resize, { passive: true });

    var last = performance.now(), spawnAcc = 0, SPAWN = 195;
    function frame(now) {
      var dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;
      if (document.visibilityState !== 'hidden') {
        spawnAcc += dt * 1000;
        while (spawnAcc >= SPAWN) { spawnAcc -= SPAWN; spawn(false); }
        for (var i = pulses.length - 1; i >= 0; i--) {
          var p = pulses[i]; p.pos += p.dir * p.sp * dt;
          var dim = p.h ? W : H;
          if ((p.dir > 0 && p.pos - p.len > dim) || (p.dir < 0 && p.pos + p.len < 0)) pulses.splice(i, 1);
        }
        render();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ---- Manifeste terminal : frappe de la commande puis sortie ---- */
  (function setupTerminal() {
    var win = document.getElementById('termWindow');
    var cmd = document.getElementById('termCmd');
    var out = document.getElementById('termOut');
    if (!cmd) return;
    var text = cmd.getAttribute('data-cmd') || '';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) { cmd.textContent = text; return; }
    if (out) { out.style.opacity = '0'; out.style.transition = 'opacity 600ms ease'; }
    var done = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !done) { done = true; io.unobserve(e.target); type(); }
      });
    }, { threshold: 0.35 });
    io.observe(win || cmd);
    function type() {
      var i = 0;
      (function tick() {
        if (i <= text.length) { cmd.textContent = text.slice(0, i); i++; setTimeout(tick, 42 + Math.random() * 40); }
        else if (out) { out.style.opacity = '1'; }
      })();
    }
  })();
