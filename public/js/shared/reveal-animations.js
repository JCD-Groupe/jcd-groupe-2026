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
     HERO — Fond animé "Flux convergent" (WebGL), signature
     unique du pôle Service. De fins filaments dérivent depuis
     les bords et convergent en continu vers un foyer unique
     (rouge JCD) — bloom focal volumétrique + voile de profondeur —
     s'illuminant à l'approche puis se dissolvant :
     "tout converge vers un seul interlocuteur". Couleurs
     pilotées par --mesh-c1..c4 (base / accent / profond / clair).
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
      'uniform vec3  u_c1;',   // base sombre
      'uniform vec3  u_c2;',   // rouge accent (foyer)
      'uniform vec3  u_c3;',   // rouge profond (profondeur)
      'uniform vec3  u_c4;',   // rouge clair (highlight chaud)
      'float h11(float n){return fract(sin(n*78.233)*43758.5453);}',
      'vec2  h22(float n){return fract(sin(vec2(n,n+1.7)*vec2(127.1,311.7))*43758.5453);}',
      'float hash21(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}',
      // Bruit de valeur lisse — voile de profondeur basse frequence
      'float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);',
      '  float a=hash21(i),b=hash21(i+vec2(1.0,0.0)),c=hash21(i+vec2(0.0,1.0)),d=hash21(i+vec2(1.0,1.0));',
      '  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/u_res.xy;',
      '  float aspect=u_res.x/max(u_res.y,1.0);',
      '  vec2 asp=vec2(aspect,1.0);',
      '  vec2 P=uv*asp;',
      // Foyer unique : a droite du titre (zone libre), respiration tres lente
      '  vec2 focus=vec2(0.68,0.50)*asp;',
      '  focus.y+=sin(u_t*0.13)*0.012;',
      '  float fd=distance(P,focus);',
      '  vec3 col=u_c1;',
      // Voile de profondeur : nebuleuse lente, confinee autour du foyer
      '  float n=vnoise(P*1.5+vec2(u_t*0.022,-u_t*0.016))*0.62',
      '         +vnoise(P*3.1-vec2(u_t*0.018,u_t*0.013))*0.38;',
      '  float haze=smoothstep(0.46,0.95,n)*exp(-fd*fd*3.0);',
      '  col=mix(col,u_c3,haze*0.46);',
      // Filaments convergents : flux doux qui derive vers le foyer puis se dissout
      '  float acc=0.0;',
      '  float accCore=0.0;',
      '  for(int i=0;i<24;i++){',
      '    float fi=float(i);',
      '    vec2 sd=h22(fi*1.37+0.5);',
      // Angle stratifie sur 360 deg : 1 filament par secteur (24) + jitter interne -> de tous les cotes, espaces, sans grappes
      '    float ang=(fi+sd.x)/24.0*6.2831;',
      '    float startR=0.72+sd.y*1.05;',
      '    float speed=0.021+h11(fi*2.1)*0.022;',
      // Phase de depart decorrelee de l angle (suite doree, faible discrepance) -> positions au chargement diversifiees
      '    float phOff=fract(fi*0.61803399);',
      '    float ph=fract(u_t*speed+phOff);',
      '    float r=startR*(1.0-ph);',
      '    vec2 dir=vec2(cos(ang),sin(ang));',
      '    vec2 pos=focus+dir*r;',
      '    vec2 dd=P-pos;',
      '    float along=dot(dd,dir);',
      '    float perp=dot(dd,vec2(-dir.y,dir.x));',
      // gaussienne anisotrope = trainee (flou de mouvement vers le foyer)
      '    float streak=exp(-(along*along*600.0+perp*perp*5000.0));',
      '    float fade=smoothstep(0.0,0.20,ph)*(1.0-smoothstep(0.70,1.0,ph));',
      '    float near=smoothstep(0.25,0.96,ph);',
      '    float b=fade*(0.32+near*0.68);',
      '    acc+=streak*b;',
      '    accCore+=streak*b*near;',
      '  }',
      // Lumiere chaude (famille rouge, jamais blanc pur) — amplitude discrete
      '  vec3 warm=mix(u_c4,vec3(1.0,0.96,0.94),0.30);',
      '  col+=warm*clamp(acc,0.0,1.2)*0.40;',
      '  col=mix(col,u_c2,clamp(accCore*0.35,0.0,0.76));',
      // Bloom focal volumetrique : 3 echelles de chute (coeur chaud -> halo large)
      '  float breath=0.94+0.06*sin(u_t*0.34);',
      '  float g1=exp(-fd*fd*120.0);',
      '  float g2=exp(-fd*fd*22.0);',
      '  float g3=exp(-fd*fd*5.0);',
      '  col+=u_c4*g1*0.20*breath;',
      '  col+=u_c2*g2*0.215*breath;',
      '  col+=u_c2*g3*0.06;',
      // Vignette + garde a gauche : le titre reste sur fond propre
      '  vec2 q=uv-0.5;',
      '  float vig=1.0-smoothstep(0.40,1.15,length(q*vec2(1.05,1.30)));',
      '  float leftGuard=smoothstep(0.0,0.46,uv.x);',
      '  col*=mix(0.55,1.0,vig);',
      '  col*=mix(0.84,1.0,leftGuard);',
      // Dither triangulaire — anti-banding sur les degrades rouges
      '  float dn=(h11(dot(gl_FragCoord.xy,vec2(12.9,78.2))+u_t)+h11(dot(gl_FragCoord.xy,vec2(7.31,41.1))-u_t)-1.0)*(1.4/255.0);',
      '  col+=dn;',
      '  col=pow(max(col,0.0),vec3(0.96));',
      '  gl_FragColor=vec4(col,1.0);',
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
    gl.uniform3fv(uC2, readMeshColor(host, 'c2', [0.898, 0.114, 0.161]));
    gl.uniform3fv(uC3, readMeshColor(host, 'c3', [0.647, 0.071, 0.110]));
    gl.uniform3fv(uC4, readMeshColor(host, 'c4', [0.941, 0.455, 0.424]));

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

    canvas.classList.add('is-ready');

    /* Boucle rAF réellement mise en pause quand le hero sort de l'écran (économie CPU/GPU) */
    var start = performance.now();
    var rafId = 0;
    function frame(now) {
      gl.uniform1f(uT, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(frame);
    }
    function play()  { if (!rafId) rafId = requestAnimationFrame(frame); }
    function pause() { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) play(); else pause();
      }, { threshold: 0 }).observe(canvas);
    }
    play();
  })();


  // Footer year
  (function setupYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  })();

  // Process flow — moteur de connecteurs courbes (forme du croquis) + reveal au scroll.
  // Les 4 courbes sont recalculées en pixels depuis le bord de chaque carte vers le
  // hub : au chargement, au resize, et image par image pendant le reveal et le survol,
  // de sorte qu'elles restent parfaitement accrochées ET suivent la carte qui bouge.
  (function setupProcessFlow() {
    var flow = document.querySelector('.pf-vflow');
    if (!flow) return;
    var svg    = flow.querySelector('.pf-vsvg');
    var cards  = [].slice.call(flow.querySelectorAll('.pf-vcard'));
    var conns  = [].slice.call(flow.querySelectorAll('.pf-conn'));
    var pulses = [].slice.call(flow.querySelectorAll('.pf-pulse'));
    var jnodes = [].slice.call(flow.querySelectorAll('.pf-jnode'));
    var hubcs  = [].slice.call(flow.querySelectorAll('.pf-hubc'));
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var REND = 26; // rayon d'accroche des connecteurs sur le hub (px)

    function buildPath(p, h, topRow, leftCol) {
      var dir = leftCol ? -1 : 1;
      var dx = Math.abs(p.x - h.x);
      var dy = Math.abs(p.y - h.y);
      // Courbe S MONOTONE (sans ondulation), identique haut/bas : on quitte le hub
      // à l'HORIZONTALE (c1y = hub.y) et on entre dans la carte à la VERTICALE (c2
      // aligné en x sur l'ancrage). Contrôles entre hub et carte → aucune inflexion.
      var c1x = h.x + dir * Math.max(54, dx * 0.56), c1y = h.y;
      var c2x = p.x, c2y = p.y + (topRow ? 1 : -1) * Math.max(44, dy * 0.85);
      return 'M ' + h.x + ' ' + h.y + ' C ' + c1x + ' ' + c1y + ' ' + c2x + ' ' + c2y + ' ' + p.x + ' ' + p.y;
    }

    function compute() {
      if (!svg || conns.length !== 4 || cards.length !== 4) return;
      if (getComputedStyle(svg).display === 'none') return; // empilé en mobile
      var fr = flow.getBoundingClientRect();
      var cx = fr.width / 2, cy = fr.height / 2;
      for (var k = 0; k < hubcs.length; k++) { hubcs[k].setAttribute('cx', cx); hubcs[k].setAttribute('cy', cy); }
      var hubl = svg.querySelector('.pf-hubl');
      if (hubl) { hubl.setAttribute('x', cx); hubl.setAttribute('y', cy + 46); }
      var hub = [
        { x: cx - REND, y: cy },                       // 0 haut-gauche -> côté gauche
        { x: cx + REND, y: cy },                        // 1 haut-droite -> côté droit
        { x: cx - REND * 0.6, y: cy + REND * 0.8 },     // 2 bas-gauche  -> bas-gauche
        { x: cx + REND * 0.6, y: cy + REND * 0.8 }      // 3 bas-droite  -> bas-droite
      ];
      for (var i = 0; i < 4; i++) {
        var r = cards[i].getBoundingClientRect();
        var topRow = (i < 2), leftCol = (i % 2 === 0);
        var p = { x: (r.left - fr.left) + r.width / 2, y: topRow ? (r.bottom - fr.top) : (r.top - fr.top) };
        var d = buildPath(p, hub[i], topRow, leftCol);
        conns[i].setAttribute('d', d);
        if (pulses[i]) pulses[i].setAttribute('d', d);
        if (jnodes[i]) {
          var cc = jnodes[i].querySelectorAll('circle');
          for (var j = 0; j < cc.length; j++) { cc[j].setAttribute('cx', p.x); cc[j].setAttribute('cy', p.y); }
        }
      }
    }

    // suivi fluide pendant les transitions (reveal / hover)
    var raf = null, until = 0;
    function loop() {
      compute();
      if (performance.now() < until) { raf = requestAnimationFrame(loop); } else { raf = null; }
    }
    function track(ms) {
      until = Math.max(until, performance.now() + ms);
      if (!raf) raf = requestAnimationFrame(loop);
    }

    if ('ResizeObserver' in window) { new ResizeObserver(function () { compute(); }).observe(flow); }
    else { window.addEventListener('resize', compute); }

    // survol : le connecteur suit la carte + tout réagit ensemble
    cards.forEach(function (card, i) {
      card.addEventListener('mouseenter', function () {
        flow.classList.add('pf-hot');
        if (conns[i]) conns[i].classList.add('pf-active');
        if (pulses[i]) pulses[i].classList.add('pf-active');
        compute(); track(840);
      });
      card.addEventListener('mouseleave', function () {
        flow.classList.remove('pf-hot');
        if (conns[i]) conns[i].classList.remove('pf-active');
        if (pulses[i]) pulses[i].classList.remove('pf-active');
        compute(); track(840);
      });
      // garantie hors-rAF : recale le connecteur à la fin de chaque transition de transform
      card.addEventListener('transitionend', function (e) { if (e.propertyName === 'transform') compute(); });
    });

    compute();
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(compute); }
    window.addEventListener('load', compute);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { compute(); track(900); } });

    // Comète de boucle : un seul flux parcourt hub→01, 01→hub, hub→02, …, 04→hub,
    // puis reboucle — l'ordre des étapes devient lisible et chaque transition
    // repasse par le hub (tout transite par le SI). La longueur du tracé est relue
    // à chaque frame : la comète reste accrochée même si la carte bouge au survol.
    var comet = svg ? svg.querySelector('.pf-comet') : null;
    var cometHalo = comet ? comet.querySelector('.pf-comet-halo') : null;
    var cometStarted = false;
    // Angles des 4 ancrages de connecteurs sur le contour du hub — mêmes offsets
    // fixes que le tableau hub[] de compute() (gauche, droite, bas-g, bas-d),
    // tous à distance REND du centre. Écran : y vers le bas (θ=π/2 → bas).
    var HUB_ANG = [Math.PI, 0, Math.atan2(0.8, -0.6), Math.atan2(0.8, 0.6)];
    function startComet() {
      if (!comet || reduce || cometStarted) return;
      cometStarted = true;
      var i = 0, phase = 'out', t0 = performance.now();
      var OUT = 1250, BACK = 1050, DWELL = 520;
      var orbA = 0, orbD = 0, orbDur = 400;
      function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
      function flash(k) {
        cards[k].classList.add('pf-seq');
        if (jnodes[k]) jnodes[k].classList.add('pf-seq');
        setTimeout(function () {
          cards[k].classList.remove('pf-seq');
          if (jnodes[k]) jnodes[k].classList.remove('pf-seq');
        }, 780);
      }
      function frame(now) {
        // empilé en mobile : SVG masqué → on met la boucle en veille
        if (getComputedStyle(svg).display === 'none') {
          comet.setAttribute('opacity', '0');
          setTimeout(function () { requestAnimationFrame(frame); }, 1200);
          return;
        }
        var dur = (phase === 'out') ? OUT : (phase === 'back') ? BACK : (phase === 'orbit') ? orbDur : DWELL;
        var t = Math.min(1, (now - t0) / dur);
        if (phase === 'out' || phase === 'back') {
          var path = conns[i], len = path.getTotalLength();
          if (len > 0) {
            var p = path.getPointAtLength(len * (phase === 'out' ? ease(t) : 1 - ease(t)));
            comet.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ')');
            comet.setAttribute('opacity', '1');
            if (cometHalo) cometHalo.setAttribute('fill', path.getAttribute('stroke'));
          }
        } else if (phase === 'orbit') {
          // La comète longe le contour du hub (r = REND) de l'ancrage i vers
          // l'ancrage suivant — les extrémités coïncident exactement avec les
          // points M des connecteurs : aucune rupture de position ni de vitesse.
          var a = orbA + orbD * ease(t);
          var hcx = parseFloat(hubcs[0].getAttribute('cx')) || 0;
          var hcy = parseFloat(hubcs[0].getAttribute('cy')) || 0;
          comet.setAttribute('transform', 'translate(' + (hcx + REND * Math.cos(a)) + ' ' + (hcy + REND * Math.sin(a)) + ')');
        }
        if (t >= 1) {
          t0 = now;
          if (phase === 'out') { flash(i); phase = 'dwell'; }
          else if (phase === 'dwell') { phase = 'back'; }
          else if (phase === 'back') {
            var next = (i + 1) % 4;
            orbA = HUB_ANG[i];
            orbD = HUB_ANG[next] - HUB_ANG[i];
            // arc le plus court ; demi-tour exact (0→1) → par le haut, libre d'ancrages
            if (orbD > Math.PI) orbD -= 2 * Math.PI;
            if (orbD <= -Math.PI) orbD += 2 * Math.PI;
            orbDur = Math.max(360, Math.abs(orbD) * 260);
            if (cometHalo) cometHalo.setAttribute('fill', conns[next].getAttribute('stroke'));
            phase = 'orbit';
          }
          else { i = (i + 1) % 4; phase = 'out'; }
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function reveal() {
      flow.classList.add('visible');
      compute(); track(2900);
      // filets de sécurité (rAF éventuellement throttlé) : recale après le reveal échelonné
      setTimeout(compute, 1600); setTimeout(function () { flow.classList.add('revealed'); compute(); }, 2700);
      setTimeout(startComet, 2400);
    }
    if (reduce || !('IntersectionObserver' in window)) { reveal(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { reveal(); io.unobserve(e.target); } });
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
