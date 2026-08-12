  /* Hero WebGL — Pluie de données premium : nappe nuageuse volumétrique en haut
     (fbm + distorsion de domaine), liseré lumineux en bord de nappe, diffusion
     sous la base, et gouttes de données sur deux plans de profondeur (parallaxe). */
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
float h(float n){return fract(sin(n*78.233)*43758.5453);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(h2(i),h2(i+vec2(1.,0.)),u.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  mat2 R=mat2(0.80,-0.60,0.60,0.80);
  for(int i=0;i<5;i++){ v+=a*vnoise(p); p=R*p*2.03+vec2(13.7,9.1); a*=0.55; }
  return v;
}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy;
  float ar=u_res.x/u_res.y;
  vec2 p=vec2(uv.x*ar,uv.y);
  // Nappe nuageuse : fbm + distorsion de domaine (drape soyeux, sans motif repetitif)
  vec2 q=vec2(fbm(p*1.9+vec2(u_t*0.028,0.0)), fbm(p*1.9+vec2(5.2,1.3)-vec2(0.0,u_t*0.020)));
  float n=fbm(p*2.3+(q-0.5)*1.6+vec2(u_t*0.012,-u_t*0.006));
  float ceiling=smoothstep(0.50,0.86,uv.y);
  float dens=smoothstep(0.34,0.78,n)*ceiling;
  float rim=(smoothstep(0.42,0.56,n)-smoothstep(0.56,0.86,n))*ceiling;
  // Lueur du dessous de nappe + diffusion lumineuse sous la base
  float base=exp(-pow((uv.y-0.52)*6.0,2.0))*(0.45+0.55*n);
  float veil=exp(-pow((uv.y-0.40)*3.2,2.0))*(0.35+0.65*q.x);
  // Pluie de donnees sur deux plans de profondeur (parallaxe)
  float drop=0.0;
  for(int L=0;L<2;L++){
    float fl=float(L);
    float cols=floor((36.0-fl*14.0)*ar);
    float cx=uv.x*cols+fl*0.5;
    float ci=floor(cx);
    float fx=fract(cx);
    float colMask=smoothstep(0.15+fl*0.05,0.0,abs(fx-0.5)-0.04-fl*0.05);
    float speed=(0.055+h(ci+fl*31.0)*0.10)*(0.75+fl*0.55);
    float seed=h(ci*1.7+2.0+fl*17.0);
    float laneAct=smoothstep(0.42,0.64,h(ci+5.0+fl*9.0));
    float acc=0.0;
    for(int k=0;k<3;k++){
      float fk=float(k);
      float py=fract(seed+fk*0.37+u_t*speed);
      float yc=1.0-py;
      float dd=(uv.y-yc)*(15.0+fl*5.0);
      float head=exp(-dd*dd);
      float above=uv.y-yc;
      float tail=exp(-max(above,0.0)*(10.0-fl*3.0))*smoothstep(0.0,0.02,above);
      float ff=smoothstep(0.02,0.28,yc)*(1.0-smoothstep(0.66,0.86,yc));
      acc+=(head+tail*0.30)*ff;
    }
    drop+=acc*colMask*laneAct*(0.32+fl*0.68);
  }
  // Etalonnage : assise sombre en bas, nappe en c3 ombree au coeur, accents c4/c2
  vec3 col=u_c1;
  col*=1.0-(1.0-uv.y)*0.10;
  col+=u_c3*dens*0.12;
  col*=1.0-dens*dens*0.10;
  col+=u_c4*rim*0.09;
  col+=u_c2*base*0.05;
  col+=u_c2*veil*0.05;
  col+=u_c4*drop*0.30;
  col+=u_c2*drop*0.10;
  float ign=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))));
  col+=vec3((ign-0.5)*0.018);
  vec2 vq=uv*2.0-1.0; vq.x*=ar;
  float vig=1.0-smoothstep(0.45,1.45,length(vq*vec2(0.62,0.8)));
  col*=mix(0.55,1.0,vig);
  gl_FragColor=vec4(max(col,0.0),1.0);
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
