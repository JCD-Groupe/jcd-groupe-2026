  /* Hero WebGL — Assemblage isométrique : composants en éclaté qui s'aimantent
     et s'emboîtent en un poste, puis se redéploient (boucle). */
  (function heroMesh(){
    var canvas=document.getElementById('heroMesh');
    if(!canvas) return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var gl=null;
    try{ var opts={antialias:false,alpha:false,premultipliedAlpha:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'};
      gl=canvas.getContext('webgl',opts)||canvas.getContext('experimental-webgl',opts); }catch(e){}
    if(!gl) return;
    var VERT='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FRAG=`precision highp float;
uniform vec2 u_res; uniform float u_t;
uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3; uniform vec3 u_c4;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float sdRB(vec2 q, vec2 b, float r){vec2 d=abs(q)-b+r;return min(max(d.x,d.y),0.)+length(max(d,0.))-r;}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy;
  float ar=u_res.x/u_res.y;
  vec2 cells=vec2(floor(7.0*ar),7.0);
  float pw=cells.y/u_res.y;
  vec2 g=uv*cells;
  vec2 id=floor(g);
  vec2 f=fract(g)-0.5;
  vec2 dir=normalize(vec2(1.0,0.55));
  float proj=dot((id+0.5)/cells,dir);
  float jit=hash(id)*0.06;
  float h2=hash(id+7.31);
  float h3=hash(id+3.77);
  float band=proj+jit;
  // Onde cyclique continue : age = temps ecoule depuis le passage du front (0 = vient d etre allume).
  // Le front revient par anticipation (pre) -> plus aucun clignotement global au rebouclage.
  float age=mod(u_t*0.11-band,1.7);
  float pre=exp(-pow((1.7-age)*6.0,2.0))*0.5;
  float act=clamp(pre+exp(-age*age*40.0)*0.9+exp(-age*2.4)*0.5,0.0,1.0);
  float box=sdRB(f,vec2(0.34,0.34),0.07);
  // Contour fin anti-alias (~1.5 px) + lueur gaussienne le long du bord
  float edge=1.0-smoothstep(0.0,pw*1.8,abs(box)-pw*0.5);
  float glow=exp(-box*box*900.0);
  float fill=smoothstep(0.0,-0.10,box);
  float core=exp(-dot(f,f)*52.0);
  // Couche de profondeur : trame 2x plus large, tres faible, derriere le mur
  vec2 f2=fract(uv*cells*0.5+vec2(0.27,0.31))-0.5;
  float box2=sdRB(f2,vec2(0.36,0.36),0.08);
  float edge2=1.0-smoothstep(0.0,pw*3.5,abs(box2)-pw*0.5);
  vec3 col=u_c1;
  col+=u_c3*edge2*0.022;
  col+=u_c3*edge*(0.030+h2*0.050);
  float lit=mix(0.62,1.0,h2);
  float flick=0.90+0.10*sin(u_t*(1.2+h2*2.4)+h3*40.0);
  col=mix(col,u_c2,edge*act*0.55*lit);
  col+=u_c2*glow*act*0.06*lit;
  col+=u_c4*fill*act*0.06*lit;
  col+=mix(u_c2,u_c4,0.4+h3*0.6)*core*act*0.34*lit*flick;
  float dn=(hash(gl_FragCoord.xy+vec2(u_t,0.0))+hash(gl_FragCoord.xy+vec2(0.0,-u_t))-1.0)*(1.6/255.0);
  col+=dn;
  vec2 gd=(uv-vec2(0.30,0.52))*vec2(1.5,2.0);
  col*=1.0-exp(-dot(gd,gd)*2.4)*0.20;
  vec2 q=uv*2.0-1.0; q.x*=ar;
  float vig=1.0-smoothstep(0.45,1.45,length(q*vec2(0.62,0.8)));
  col*=mix(0.55,1.0,vig);
  col=pow(max(col,0.0),vec3(0.96));
  gl_FragColor=vec4(col,1.0);
}`;
    function compile(t,s){var sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){gl.deleteShader(sh);return null;}return sh;}
    var vs=compile(gl.VERTEX_SHADER,VERT),fs=compile(gl.FRAGMENT_SHADER,FRAG);
    if(!vs||!fs) return;
    var prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    var aLoc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(aLoc);gl.vertexAttribPointer(aLoc,2,gl.FLOAT,false,0,0);
    var uRes=gl.getUniformLocation(prog,'u_res'),uT=gl.getUniformLocation(prog,'u_t');
    var uC1=gl.getUniformLocation(prog,'u_c1'),uC2=gl.getUniformLocation(prog,'u_c2'),uC3=gl.getUniformLocation(prog,'u_c3'),uC4=gl.getUniformLocation(prog,'u_c4');
    function readMeshColor(host,name,fb){var raw=getComputedStyle(host).getPropertyValue('--mesh-'+name).trim();if(!raw)return fb;var parts=raw.split(',').map(function(n){return parseFloat(n)/255;});if(parts.length!==3||parts.some(function(v){return isNaN(v);}))return fb;return parts;}
    var host=canvas.closest('.print-hero')||canvas.parentElement;
    gl.uniform3fv(uC1,readMeshColor(host,'c1',[0.051,0.051,0.051]));
    gl.uniform3fv(uC2,readMeshColor(host,'c2',[0.180,0.447,0.729]));
    gl.uniform3fv(uC3,readMeshColor(host,'c3',[0.118,0.353,0.580]));
    gl.uniform3fv(uC4,readMeshColor(host,'c4',[0.322,0.565,0.796]));
    function resize(){var dpr=Math.min(window.devicePixelRatio||1,2);var w=Math.max(1,Math.floor(canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(canvas.clientHeight*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);gl.uniform2f(uRes,w,h);}}
    resize();
    if(window.ResizeObserver){new ResizeObserver(resize).observe(canvas);}else{window.addEventListener('resize',resize,{passive:true});}
    var running=true;
    if('IntersectionObserver' in window){new IntersectionObserver(function(en){running=en[0].isIntersecting;},{threshold:0}).observe(canvas);}
    canvas.classList.add('is-ready');
    var start=performance.now();
    function frame(now){if(running){gl.uniform1f(uT,(now-start)/1000);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}requestAnimationFrame(frame);}
    requestAnimationFrame(frame);
  })();

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


  (function setupInfoSubnav() {
    var el = document.querySelector('.info-subnav__link.is-active') ||
             document.querySelector('.info-subnav__home.is-active');
    var rail = document.querySelector('.info-subnav__inner');
    if (!el || !rail) return;
    /* Centrage horizontal manuel : seul le rail défile (scrollIntoView
       pouvait faire défiler la page elle-même → tressaillement à l'arrivée). */
    var r = el.getBoundingClientRect(), rr = rail.getBoundingClientRect();
    rail.scrollLeft += (r.left + r.width / 2) - (rr.left + rr.width / 2);
  })();

  /* Smooth scroll activé après le premier rendu seulement (cf. html.is-loaded) :
     les sauts d'ancre au chargement restent instantanés, sans défilement parasite. */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.documentElement.classList.add('is-loaded');
    });
  });
