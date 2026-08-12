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

  /* ---- Logos clients : nom lisible au hover (alt -> data-name) ---- */
  (function () {
    document.querySelectorAll('.logo-marquee-item').forEach(function (item) {
      var img = item.querySelector('img');
      if (img && img.alt) item.setAttribute('data-name', img.alt);
    });
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

  /* ---- Hero WebGL — organic growth (racines/branches) ---- */
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
      'float h11(float n){return fract(sin(n*78.233)*43758.5453);}',
      /* Bruit de valeur a interpolation quintique : degrades plus onctueux que le cubique */
      'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);float a=hash(i);float b=hash(i+vec2(1.,0.));float c=hash(i+vec2(0.,1.));float d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
      /* fbm 5 octaves + rotation inter-octave : casse les alignements d axes */
      'float fbm(vec2 p){float v=0.;float a=.5;mat2 R=mat2(.8,.6,-.6,.8);for(int i=0;i<5;i++){v+=a*noise(p);p=R*p*2.02+vec2(17.3,9.1);a*=.5;}return v;}',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/u_res.xy;',
      '  vec2 p=uv*2.-1.;',
      '  p.x*=u_res.x/u_res.y;',
      '  float t=u_t*.045;',
      /* Distorsion de domaine a deux etages : veines soyeuses, pas de blobs */
      '  vec2 q=vec2(fbm(p*.62+vec2(t*.7,-t*.35)),fbm(p*.62+vec2(5.2,1.3)-vec2(t*.4,t*.6)));',
      '  vec2 r=vec2(fbm(p*.62+1.7*q+vec2(1.7,9.2)+vec2(t*.30,t*.18)),fbm(p*.62+1.7*q+vec2(8.3,2.8)-vec2(t*.22,t*.34)));',
      '  float f=fbm(p*.62+1.9*r);',
      /* Hierarchie lumineuse : voile -> nappe -> cretes fines */
      '  vec3 col=u_c1;',
      '  float haze=smoothstep(.22,.88,f);',
      '  float sheet=smoothstep(.52,.94,f)*smoothstep(.9,.25,length(q));',
      '  float crest=smoothstep(.68,.99,f)*smoothstep(1.,.3,length(r));',
      '  col=mix(col,u_c3,haze*.34);',
      '  col=mix(col,u_c2,sheet*.26);',
      '  col+=u_c4*crest*.12;',
      /* Foyer discret cote constellation (droite), respiration tres lente */
      '  float breath=.93+.07*sin(u_t*.26);',
      '  vec2 focus=vec2(u_res.x/u_res.y*.46,.16);',
      '  float fd=length(p-focus);',
      '  col+=u_c2*exp(-fd*fd*1.9)*.10*breath;',
      '  col+=u_c4*exp(-fd*fd*5.5)*.06*breath;',
      /* Garde a gauche : le titre reste sur fond calme */
      '  col*=mix(.82,1.,smoothstep(.02,.48,uv.x));',
      /* Vignette douce */
      '  float vig=1.-smoothstep(.36,1.46,length((p-vec2(0.,.05))*vec2(.62,.82)));',
      '  col*=mix(.52,1.,vig);',
      /* Desaturation des ombres : rendu mat dans les bas */
      '  float lum=dot(col,vec3(.299,.587,.114));',
      '  col=mix(vec3(lum),col,mix(.78,1.,smoothstep(.02,.16,lum)));',
      /* Dither triangulaire anti-banding (remplace le grain blanc) */
      '  float dn=(h11(dot(gl_FragCoord.xy,vec2(12.9,78.2))+u_t)+h11(dot(gl_FragCoord.xy,vec2(7.31,41.1))-u_t)-1.)*(1.6/255.);',
      '  col+=dn;',
      '  col=pow(max(col,0.),vec3(.95));',
      '  gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
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
    gl.uniform3fv(uC2, readMeshColor(host, 'c2', [0.557, 0.753, 0.255]));
    gl.uniform3fv(uC3, readMeshColor(host, 'c3', [0.424, 0.580, 0.188]));
    gl.uniform3fv(uC4, readMeshColor(host, 'c4', [0.643, 0.816, 0.361]));

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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


  /* ---- Mega menu Catalogue ---- */
  (function setupCatalogueMenu() {
    var trigger = document.getElementById("nav-catalogue-trigger");
    var panel = document.getElementById("nav-catalogue-panel");
    var pill = document.getElementById("nav-catalogue-pill");
    var navbar = document.getElementById("navbar");
    if (!trigger || !panel || !pill || !navbar) return;

    var body = panel.querySelector(".ncat-body");
    var search = panel.querySelector(".ncat-search");
    var input = panel.querySelector(".ncat-input");
    var cats = Array.prototype.slice.call(panel.querySelectorAll(".ncat-cat"));
    var groups = Array.prototype.slice.call(
      panel.querySelectorAll(".ncat-group"),
    );
    var items = Array.prototype.slice.call(
      panel.querySelectorAll(".ncat-item"),
    );
    var focusables = Array.prototype.slice.call(
      panel.querySelectorAll(
        ".ncat-cat, .ncat-item, .ncat-group-all, .ncat-foot-cta, .ncat-void-reset",
      ),
    );

    var openTimer = null,
      closeTimer = null,
      hoverTimer = null,
      isOpen = false;

    /* Index de recherche : libellés normalisés sans accents. */
    function fold(s) {
      return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    }
    items.forEach(function (it) {
      it.setAttribute("data-q", fold(it.textContent));
    });

    function setTabbable(on) {
      focusables.forEach(function (el) {
        el.setAttribute("tabindex", on ? "0" : "-1");
      });
      if (input) input.setAttribute("tabindex", on ? "0" : "-1");
    }
    setTabbable(false);

    function clearTimers() {
      if (openTimer) {
        window.clearTimeout(openTimer);
        openTimer = null;
      }
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    window.__jcdNavClosers = window.__jcdNavClosers || [];

    function openPanel() {
      clearTimers();
      if (isOpen) return;
      isOpen = true;
      window.__jcdNavClosers.forEach(function (fn) {
        if (fn !== closePanel) fn();
      });
      trigger.setAttribute("aria-expanded", "true");
      panel.setAttribute("aria-hidden", "false");
      setTabbable(true);
    }
    function closePanel() {
      clearTimers();
      if (!isOpen) return;
      isOpen = false;
      trigger.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
      resetSearch();
      setTabbable(false);
    }
    window.__jcdNavClosers.push(closePanel);

    function deferOpen() {
      clearTimers();
      openTimer = window.setTimeout(openPanel, 60);
    }
    function deferClose() {
      clearTimers();
      closeTimer = window.setTimeout(closePanel, 180);
    }

    [pill, panel].forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        deferOpen();
      });
      el.addEventListener("mouseleave", function () {
        deferClose();
      });
    });

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      if (isOpen) closePanel();
      else openPanel();
    });

    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPanel();
        if (input) input.focus();
      } else if (e.key === "Escape" && isOpen) {
        closePanel();
        trigger.focus();
      }
    });

    /* — Sélection de catégorie (survol ou focus du rail) — */
    function activate(slug) {
      cats.forEach(function (c) {
        c.setAttribute(
          "aria-selected",
          String(c.getAttribute("data-cat") === slug),
        );
      });
      groups.forEach(function (g) {
        g.classList.toggle("is-active", g.getAttribute("data-cat") === slug);
      });
    }
    cats.forEach(function (cat) {
      cat.addEventListener("mouseenter", function () {
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        hoverTimer = setTimeout(function () {
          activate(cat.getAttribute("data-cat"));
        }, 55);
      });
      cat.addEventListener("focus", function () {
        activate(cat.getAttribute("data-cat"));
      });
    });

    /* — Recherche instantanée plein catalogue — */
    function applySearch(qRaw) {
      var q = fold(qRaw.trim());
      var hits = 0;
      if (search) search.classList.toggle("has-query", q.length > 0);
      if (!q) {
        body.classList.remove("is-searching", "no-results");
        items.forEach(function (it) {
          it.removeAttribute("hidden");
        });
        groups.forEach(function (g) {
          g.removeAttribute("data-empty");
        });
        return;
      }
      body.classList.add("is-searching");
      var terms = q.split(/\s+/);
      groups.forEach(function (g) {
        var any = false;
        g.querySelectorAll(".ncat-item").forEach(function (it) {
          var hay = it.getAttribute("data-q") || "";
          var ok = terms.every(function (t) {
            return hay.indexOf(t) !== -1;
          });
          if (ok) {
            it.removeAttribute("hidden");
            any = true;
            hits++;
          } else {
            it.setAttribute("hidden", "");
          }
        });
        g.setAttribute("data-empty", any ? "false" : "true");
      });
      body.classList.toggle("no-results", hits === 0);
    }
    function resetSearch() {
      if (!input) return;
      input.value = "";
      applySearch("");
    }
    if (input) {
      input.addEventListener("input", function () {
        applySearch(input.value);
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          if (input.value) {
            e.stopPropagation();
            resetSearch();
          } else {
            closePanel();
            trigger.focus();
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (body.classList.contains("is-searching")) {
            var first = panel.querySelector(".ncat-item:not([hidden])");
            if (first) first.click();
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          var next = body.classList.contains("is-searching")
            ? panel.querySelector(".ncat-item:not([hidden])")
            : cats[0];
          if (next) next.focus();
        }
      });
    }
    var voidReset = panel.querySelector(".ncat-void-reset");
    if (voidReset) {
      voidReset.addEventListener("click", function () {
        resetSearch();
        if (input) input.focus();
      });
    }

    /* — Navigation clavier : rail vertical, flèche droite vers la
         scène, flèche gauche pour revenir au rail. — */
    cats.forEach(function (cat, i) {
      cat.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          cats[(i + 1) % cats.length].focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          cats[(i - 1 + cats.length) % cats.length].focus();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          var g = panel.querySelector(
            ".ncat-group.is-active .ncat-item:not([hidden])",
          );
          if (g) g.focus();
        } else if (e.key === "Escape") {
          closePanel();
          trigger.focus();
        }
      });
    });
    items.forEach(function (item) {
      item.addEventListener("keydown", function (e) {
        var visible = items.filter(function (it) {
          return !it.hasAttribute("hidden") && it.offsetParent !== null;
        });
        var idx = visible.indexOf(item);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (visible.length) visible[(idx + 1) % visible.length].focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (visible.length)
            visible[(idx - 1 + visible.length) % visible.length].focus();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          var current =
            panel.querySelector('.ncat-cat[aria-selected="true"]') || cats[0];
          current.focus();
        } else if (e.key === "Escape") {
          closePanel();
          trigger.focus();
        }
      });
    });

    document.addEventListener("click", function (e) {
      if (!isOpen) return;
      if (navbar.contains(e.target)) return;
      closePanel();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) {
        closePanel();
        trigger.focus();
      }
    });

    /* — Raccourci « / » : focus la recherche locale si la page en a
         une (pages catégories), sinon ouvre le catalogue et focus
         sa recherche. Ignoré pendant une saisie. — */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      e.preventDefault();
      var local = document.getElementById("ct-search");
      if (local) {
        local.focus();
        local.select();
        return;
      }
      openPanel();
      if (input)
        window.setTimeout(function () {
          input.focus();
        }, 90);
    });

    /* — Marqueur de catégorie courante (pages formation-*) — */
    var here = (location.pathname.split("/").pop() || "").toLowerCase();
    cats.forEach(function (c) {
      var target = (c.getAttribute("href") || "")
        .split("/")
        .pop()
        .toLowerCase();
      if (target && target === here) {
        c.classList.add("is-current");
        activate(c.getAttribute("data-cat"));
      }
    });
  })();
