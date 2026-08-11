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
     HERO MESH — Gradient WebGL fluide, piloté par les
     variables CSS --mesh-c1..c4 du .print-hero (RGB 0-255).
     Pattern universel : à dupliquer tel quel sur les autres
     pages expertises, seules les valeurs --mesh-* changent.
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
      // Simplex 2D noise (Ashima Arts — domaine public)
      'vec3 perm(vec3 x){return mod(((x*34.)+1.)*x,289.);}',
      'float snoise(vec2 v){',
      '  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);',
      '  vec2 i=floor(v+dot(v,C.yy));',
      '  vec2 x0=v-i+dot(i,C.xx);',
      '  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);',
      '  vec4 x12=x0.xyxy+C.xxzz;',
      '  x12.xy-=i1;',
      '  i=mod(i,289.);',
      '  vec3 p=perm(perm(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));',
      '  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);',
      '  m=m*m;m=m*m;',
      '  vec3 x=2.*fract(p*C.www)-1.;',
      '  vec3 h=abs(x)-.5;',
      '  vec3 ox=floor(x+.5);',
      '  vec3 a0=x-ox;',
      '  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);',
      '  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;',
      '  g.yz=a0.yz*x12.xz+h.yz*x12.yw;',
      '  return 130.*dot(m,g);',
      '}',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/u_res.xy;',
      '  vec2 p=uv*2.-1.;',
      '  p.x*=u_res.x/u_res.y;',
      '  float t=u_t*.045;',
      // Champ de distorsion (warp les coords avant les blobs)
      '  vec2 d=vec2(',
      '    snoise(p*.65+vec2(t*1.1,t*.8)),',
      '    snoise(p*.65+vec2(-t*.9,t*1.3))',
      '  )*.36;',
      // Trois blobs sur les coords distordues
      '  float n1=snoise((p+d)*.62+vec2(t,0.));',
      '  float n2=snoise((p-d*.7)*1.05+vec2(0.,t*.7));',
      '  float n3=snoise((p*1.35+d*.5)+vec2(-t*.5,t*.3));',
      '  float b1=smoothstep(.05,1.,n1);',
      '  float b2=smoothstep(-.05,.9,n2);',
      '  float b3=smoothstep(-.2,.8,n3);',
      // Mélange : base sombre + 3 nuances d'accent (intensité réduite pour rester premium/dark)
      '  vec3 col=u_c1;',
      '  col=mix(col,u_c2,b1*.30);',
      '  col=mix(col,u_c4,b2*.18);',
      '  col=mix(col,u_c3*.85,b3*.12);',
      // Highlight subtil pour casser la planéité
      '  float streak=smoothstep(.6,1.,n1*.65+.3)*smoothstep(0.,.5,b2);',
      '  col+=u_c4*streak*.08;',
      // Vignette intégrée — plus prononcée pour focus contenu
      '  float vig=1.-smoothstep(.3,1.4,length(p*vec2(.6,.75)));',
      '  col*=mix(.42,1.,vig);',
      // Léger gamma pour densifier
      '  col=pow(max(col,0.),vec3(.96));',
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
    gl.uniform3fv(uC1, readMeshColor(host, 'c1', [0.05, 0.05, 0.05]));
    gl.uniform3fv(uC2, readMeshColor(host, 'c2', [0.95, 0.58, 0.11]));
    gl.uniform3fv(uC3, readMeshColor(host, 'c3', [0.77, 0.47, 0.09]));
    gl.uniform3fv(uC4, readMeshColor(host, 'c4', [0.97, 0.63, 0.25]));

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
