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


  // Partenaires — bascule en mode "has-logo" si le fichier image se charge
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


  // Navbar — bascule .scrolled au défilement
  (function setupNavScroll() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;
    var ticking = false;
    function update() {
      navbar.classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();


  /* ----------------------------------------------------
     MANIFESTE "Lignes de cote" — à l'entrée dans le viewport,
     le faisceau de lumière s'allume et les cotes (lignes
     d'attache, ticks, libellés) se tracent en cascade. Tout
     est piloté en CSS via la classe .is-lit ; sans JS, le
     manifeste s'affiche déjà dans son état final.
     ---------------------------------------------------- */
  (function setupManifestoCote() {
    var mf = document.querySelector('.manifesto');
    if (!mf) return;
    if (!('IntersectionObserver' in window)) { mf.classList.add('is-lit'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          mf.classList.add('is-lit');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    io.observe(mf);
  })();

  /* ----------------------------------------------------
     HERO — Halo satiné (WebGL) : plis de matière taupe
     très basse fréquence, dérive lente, sans bruit —
     la couleur se replie sur elle-même comme un satin.
     Une lentille elliptique animée déforme et assombrit
     le fond sous le titre pour garder le texte lisible.
     Couleurs pilotées par --mesh-c1..c4.
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
      'uniform vec2  u_tC;',
      'uniform vec2  u_tR;',
      'uniform float u_px;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
      'float h11(float n){return fract(sin(n*78.233)*43758.5453);}',
      // Bruit de valeur quintique + fbm 4 octaves tournees : micro-matiere textile
      'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);float a=hash(i);float b=hash(i+vec2(1.,0.));float c=hash(i+vec2(0.,1.));float d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
      'float fbm(vec2 p){float v=0.;float a=.5;mat2 R=mat2(.8,.6,-.6,.8);for(int i=0;i<4;i++){v+=a*noise(p);p=R*p*2.03+vec2(11.7,7.3);a*=.5;}return v;}',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/u_res.xy;',
      '  float asp=u_res.x/u_res.y;',
      '  vec2 p=uv;',
      '  p.x*=asp;',
      '  float t=u_t*.05;',
      // Lentille elliptique sous le titre : deformation douce et animee
      '  vec2 pC=vec2(u_tC.x*asp,u_tC.y);',
      '  vec2 pR=vec2(max(u_tR.x,.001)*asp,max(u_tR.y,.001));',
      '  float e=length((p-pC)/pR);',
      '  float lens=(1.-smoothstep(.30,1.18,e))*(.82+.18*sin(u_t*.5));',
      '  vec2 rel=p-pC;',
      '  float ang=lens*(.34+.26*sin(u_t*.37));',
      '  float cs=cos(ang),sn=sin(ang);',
      '  rel=mat2(cs,-sn,sn,cs)*rel*(1.-lens*.20);',
      '  p=pC+rel;',
      // Domaine ondule tres basse frequence : plis de satin, aucun bruit
      '  vec2 q=p;',
      '  q+=.16*vec2(sin(p.y*2.1+t*1.05),cos(p.x*1.7-t*.85));',
      '  q+=.09*vec2(sin(p.y*3.4-t*.70),cos(p.x*2.7+t*.80));',
      // Distorsion fbm : le satin gagne un froisse organique (casse les bandes sinusoidales)
      '  float w=fbm(p*1.9+vec2(t*.5,-t*.35));',
      '  q+=.11*vec2(w-.5,fbm(p*1.9+vec2(4.7,2.3)+vec2(-t*.3,t*.45))-.5)*2.;',
      // Champ de plis lisse, 0..1 — deux ondes croisees, satin froisse
      '  float fold=sin(q.x*3.7+q.y*2.5+t)*.5+.5;',
      '  fold=mix(fold,sin(q.x*1.6-q.y*2.9-t*.8)*.5+.5,.4);',
      '  fold=mix(fold,w,.22);',
      '  fold=smoothstep(.06,.94,fold);',
      // Grande flaque de lumiere douce, derive lente
      '  vec2 a=vec2(.96+.08*sin(t*.8),.34+.05*cos(t*.7));',
      '  float glow=exp(-length(p-a)*1.9);',
      // Composition — les plis font alterner brun profond et brun chocolat
      '  vec3 col=mix(u_c1,u_c3,fold);',
      '  col=mix(col,u_c2,glow*.50);',
      '  col+=u_c4*exp(-length(p-a)*4.5)*.09;',
      // Lisere satine creme sur la crete des plis
      '  float sheen=pow(fold,2.4)*(.70+.30*fbm(q*5.5+vec2(t*.6,-t*.4)));',
      '  col=mix(col,u_c4,sheen*.26*(.30+.70*glow));',
      // La lentille assombrit la zone du titre : le texte du pole reste lisible
      '  col*=1.-lens*.30;',
      // Trame papier millimetre : derive lente + mailles qui se fondent
      '  vec2 gpx=gl_FragCoord.xy/max(u_px,.001);',
      '  gpx+=9.0*vec2(sin(u_t*.06),cos(u_t*.045));',
      '  vec2 dM=abs(fract(gpx/132.0)-.5)*132.0;',
      '  vec2 dm=abs(fract(gpx/33.0)-.5)*33.0;',
      '  float maj=1.-smoothstep(.0,1.05,min(dM.x,dM.y));',
      '  float mnr=1.-smoothstep(.0,.90,min(dm.x,dm.y));',
      '  float grid=max(maj,mnr*.42);',
      // champ lent : certaines mailles se fondent dans le fond
      '  float gf=sin(uv.x*5.2+u_t*.14)+sin(uv.y*4.3-u_t*.11)+sin((uv.x+uv.y)*6.9+u_t*.085);',
      '  gf=smoothstep(-2.8,1.0,gf);',
      '  grid*=mix(.16,1.,gf);',
      // fondu vers les bords + attenuation sous la lentille du titre
      '  float gef=1.-smoothstep(.42,1.05,length((uv-vec2(.5,.58))*vec2(1.05,1.18)));',
      '  grid*=gef*(1.-lens*.45);',
      '  col=mix(col,vec3(.90,.87,.82),grid*.11);',
      // Vignette integree
      '  float vig=1.-smoothstep(.40,1.38,length((uv-.5)*vec2(1.12,1.26)));',
      '  col*=mix(.52,1.,vig);',
      // Dithering anti-banding (1/255, invisible)
      '  float dn=(h11(dot(gl_FragCoord.xy,vec2(12.9,78.2))+u_t)+h11(dot(gl_FragCoord.xy,vec2(7.31,41.1))-u_t)-1.)*(1.6/255.);',
      '  col+=dn;',
      '  col=pow(max(col,0.),vec3(.96));',
      '  gl_FragColor=vec4(max(col,0.),1.);',
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
    var uTC  = gl.getUniformLocation(prog, 'u_tC');
    var uTR  = gl.getUniformLocation(prog, 'u_tR');
    var uPx  = gl.getUniformLocation(prog, 'u_px');

    function readMeshColor(host, name, fallback) {
      var raw = getComputedStyle(host).getPropertyValue('--mesh-' + name).trim();
      if (!raw) return fallback;
      var parts = raw.split(',').map(function (n) { return parseFloat(n) / 255; });
      if (parts.length !== 3 || parts.some(function (v) { return isNaN(v); })) return fallback;
      return parts;
    }

    var host = canvas.closest('.print-hero') || canvas.parentElement;
    gl.uniform3fv(uC1, readMeshColor(host, 'c1', [0.102, 0.075, 0.051]));
    gl.uniform3fv(uC2, readMeshColor(host, 'c2', [0.749, 0.580, 0.392]));
    gl.uniform3fv(uC3, readMeshColor(host, 'c3', [0.471, 0.353, 0.239]));
    gl.uniform3fv(uC4, readMeshColor(host, 'c4', [0.859, 0.773, 0.651]));

    /* Lentille de lisibilité : ellipse calée sur le titre du hero.
       Mesurée chaque frame — suit le titre pendant son apparition. */
    gl.uniform2f(uTC, 0.30, 0.62);
    gl.uniform2f(uTR, 0.28, 0.22);
    gl.uniform1f(uPx, Math.min(window.devicePixelRatio || 1, 1.5));
    var titleEl = document.querySelector('#agc-hero-title .accent-grad')
               || document.getElementById('agc-hero-title');
    function updateTitleLens() {
      if (!titleEl) return;
      var cr = canvas.getBoundingClientRect();
      if (cr.width < 1 || cr.height < 1) return;
      var tr = titleEl.getBoundingClientRect();
      var cx = (tr.left + tr.right) / 2 - cr.left;
      var cy = (tr.top + tr.bottom) / 2 - cr.top;
      gl.uniform2f(uTC, cx / cr.width, 1 - cy / cr.height);
      gl.uniform2f(uTR,
        (tr.width  * 0.5 * 1.46) / cr.width,
        (tr.height * 0.5 * 3.45) / cr.height);
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.floor(canvas.clientWidth  * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
        gl.uniform1f(uPx, dpr);
      }
    }
    resize();

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener('resize', resize, { passive: true });
    }

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
        updateTitleLens();
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


  /* ----------------------------------------------------
     NAVBAR v2 — Dropdown "Nos solutions"
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
