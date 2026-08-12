  // Reveal animations
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
     MANIFESTE "Transmission" — la citation se décode au
     scroll : chaque caractère se verrouille, gauche→droite
     (effet de réception de signal). Le texte réel est dans
     le HTML : sans JS / reduced-motion, il s'affiche tel quel.
     ---------------------------------------------------- */
  (function setupTransmissionDecode() {
    var quote = document.querySelector('[data-tx-decode]');
    if (!quote) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    var walker = document.createTreeWalker(quote, NodeFilter.SHOW_TEXT, null);
    var segs = [], node;
    while (node = walker.nextNode()) {
      segs.push({ node: node, text: node.nodeValue });
    }
    if (!segs.length) return;

    var glyphs = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789/<>=+*·:.';
    function rand() { return glyphs.charAt((Math.random() * glyphs.length) | 0); }

    var total = 0;
    segs.forEach(function (s) {
      s.chars = s.text.split('').map(function (ch) {
        var space = (ch === ' ' || ch === ' ' || ch === '\n');
        var c = { ch: ch, space: space, order: space ? -1 : total };
        if (!space) total++;
        return c;
      });
    });

    function render(locked) {
      segs.forEach(function (s) {
        var out = '';
        for (var i = 0; i < s.chars.length; i++) {
          var c = s.chars[i];
          out += (c.space || c.order < locked) ? c.ch : rand();
        }
        s.node.nodeValue = out;
      });
    }
    render(0);

    var done = false;
    function decode() {
      if (done) return;
      done = true;
      var dur = Math.min(1400, 320 + total * 4);
      var t0 = performance.now();
      (function step(now) {
        var p = (now - t0) / dur;
        if (p >= 1) { render(total + 1); return; }
        var eased = p * p * (3 - 2 * p);
        render(Math.floor(eased * (total + 1)));
        requestAnimationFrame(step);
      })(t0);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { decode(); io.unobserve(e.target); }
      });
    }, { threshold: 0.25 });
    io.observe(quote);
  })();


  /* ----------------------------------------------------
     HERO — Fond animé "Propagation" : ondes concentriques
     de signal (WebGL), signature unique du pôle Télécom.
     Deux émetteurs hors-cadre diffusent des anneaux violets,
     pilotés par les variables CSS --mesh-c1..c4 du .print-hero.
     ---------------------------------------------------- */
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
      // Hash — grain leger anti-banding
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
      'float h11(float n){return fract(sin(n*78.233)*43758.5453);}',
      // Bruit quintique + fbm 4 octaves tournees : milieu de propagation organique
      'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);float a=hash(i);float b=hash(i+vec2(1.,0.));float c=hash(i+vec2(0.,1.));float d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
      'float fbm(vec2 p){float v=0.;float a=.5;mat2 R=mat2(.8,.6,-.6,.8);for(int i=0;i<4;i++){v+=a*noise(p);p=R*p*2.03+vec2(11.7,7.3);a*=.5;}return v;}',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/u_res.xy;',
      '  vec2 p=uv*2.-1.;',
      '  p.x*=u_res.x/u_res.y;',
      '  float t=u_t;',
      // Deux emetteurs hors-cadre : bas-gauche (principal), haut-droite (secondaire)
      '  vec2 s1=vec2(-1.18,-1.30);',
      '  vec2 s2=vec2(1.72,1.26);',
      '  float d1=length(p-s1);',
      '  float d2=length(p-s2);',
      // Respiration lente des sources
      '  d1+=.06*sin(t*.23);',
      '  d2+=.05*sin(t*.19+1.6);',
      // Refraction : le milieu devie legerement les fronts d onde (cercles vivants)
      '  d1+=(fbm(p*2.2+vec2(t*.05,-t*.04))-.5)*.16;',
      '  d2+=(fbm(p*2.2+vec2(3.7,1.9)-vec2(t*.045,t*.035))-.5)*.14;',
      // Ondes concentriques : sin(distance*freq - temps*vitesse) -> anneaux qui s eloignent
      // Vitesse de diffusion ralentie de 20% (1.05->.84, .82->.656)
      '  float w1=sin(d1*8.5-t*.84);',
      '  float w2=sin(d2*10.5-t*.656);',
      // Anneaux nets : crete positive + puissance pour affiner le trait
      '  float r1=pow(max(w1,0.),3.4);',
      '  float r2=pow(max(w2,0.),4.6);',
      // Attenuation : les anneaux lointains s estompent
      '  r1*=exp(-d1*.92);',
      '  r2*=exp(-d2*1.20);',
      // Variation d intensite le long des fronts : plus d uniformite mecanique
      '  float rmod=.68+.32*fbm(p*1.7+vec2(-t*.03,t*.05));',
      '  r1*=rmod;',
      '  r2*=mix(1.,rmod,.6);',
      // Estompage accentue dans la zone de contact des deux trains (centre du hero)
      '  float contact=1.-smoothstep(.10,1.05,length(p));',
      '  r1*=1.-contact*.62;',
      '  r2*=1.-contact*.62;',
      // Halo ambiant autour de chaque emetteur
      '  float halo=exp(-d1*1.55)*.55+exp(-d2*2.10)*.30;',
      // Composition couleur
      '  vec3 col=u_c1;',
      '  col+=u_c3*halo*.65;',
      // Voile atmospherique discret entre les anneaux
      '  col=mix(col,u_c3,fbm(p*1.1+vec2(t*.02,t*.016))*exp(-d1*.75)*.22);',
      '  col=mix(col,u_c2,r1*.52);',
      '  col=mix(col,u_c4,r2*.30);',
      // Coeur clair des anneaux + eclat d interference (les 2 trains coincident)
      '  col+=u_c4*pow(max(w1,0.),14.)*exp(-d1*.92)*rmod*.18;',
      '  col+=u_c4*pow(r1,1.6)*.10;',
      '  col+=u_c4*(r1*r2)*.70;',
      // Grain leger
      '  float dn=(h11(dot(gl_FragCoord.xy,vec2(12.9,78.2))+u_t)+h11(dot(gl_FragCoord.xy,vec2(7.31,41.1))-u_t)-1.)*(1.6/255.);',
      '  col+=dn;',
      // Vignette integree — focus sur le contenu
      '  float vig=1.-smoothstep(.32,1.42,length(p*vec2(.62,.78)));',
      '  col*=mix(.46,1.,vig);',
      // Leger gamma pour densifier
      '  col=pow(max(col,0.),vec3(.95));',
      '  gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
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

    /* Lit une variable CSS RGB "243, 148, 29" et la normalise [0..1] */
    function readMeshColor(host, name, fallback) {
      var raw = getComputedStyle(host).getPropertyValue('--mesh-' + name).trim();
      if (!raw) return fallback;
      var parts = raw.split(',').map(function (n) { return parseFloat(n) / 255; });
      if (parts.length !== 3 || parts.some(function (v) { return isNaN(v); })) return fallback;
      return parts;
    }

    var host = canvas.closest('.print-hero') || canvas.parentElement;
    gl.uniform3fv(uC1, readMeshColor(host, 'c1', [0.051, 0.051, 0.051]));
    gl.uniform3fv(uC2, readMeshColor(host, 'c2', [0.553, 0.173, 0.529]));
    gl.uniform3fv(uC3, readMeshColor(host, 'c3', [0.431, 0.129, 0.412]));
    gl.uniform3fv(uC4, readMeshColor(host, 'c4', [0.690, 0.388, 0.675]));

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.floor(canvas.clientWidth  * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
    }
    resize();

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener('resize', resize, { passive: true });
    }

    /* Pause quand le hero sort de l'écran (économie CPU/GPU sur le manifesto) */
    var running = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(canvas);
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


  // Footer year
  (function setupYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  })();

  // Process flow — déclenche l'animation au scroll
  (function setupProcessFlow() {
    var flow = document.querySelector('.pf-vflow');
    if (!flow) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      flow.classList.add('visible');
      return;
    }
    if (!('IntersectionObserver' in window)) {
      flow.classList.add('visible');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          flow.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });
    io.observe(flow);
  })();

  // Logo wall — bascule en mode "has-logo" si le fichier image existe et se charge
  (function setupLogoTiles() {
    var imgs = document.querySelectorAll('.logo-tile-img');
    imgs.forEach(function (img) {
      var tile = img.closest('.logo-tile');
      if (!tile) return;
      var markLoaded = function () {
        if (img.naturalWidth > 0) tile.classList.add('has-logo');
        else img.style.display = 'none';
      };
      var markMissing = function () { img.style.display = 'none'; };
      if (img.complete) markLoaded();
      else {
        img.addEventListener('load', markLoaded, { once: true });
        img.addEventListener('error', markMissing, { once: true });
      }
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
