(function(){
  var d=document, body=d.body;
  /* 1) inert collapsed accordion panels (skip the overlay itself) */
  function sync(btn){
    var id=btn.getAttribute('aria-controls'); if(!id || id==='jcdMnav') return;
    var p=d.getElementById(id); if(!p) return;
    if(btn.getAttribute('aria-expanded')==='true'){ p.removeAttribute('inert'); } else { p.setAttribute('inert',''); }
  }
  Array.prototype.forEach.call(d.querySelectorAll('[aria-controls][aria-expanded]'), function(b){
    sync(b);
    try{ new MutationObserver(function(){ sync(b); }).observe(b,{attributes:true,attributeFilter:['aria-expanded']}); }catch(e){}
  });
  /* 2) inert the page behind the open overlay */
  var mnav=d.getElementById('jcdMnav'), burger=d.getElementById('jcdBurger'), fab=d.getElementById('jcd-fab');
  if(mnav){
    try{ new MutationObserver(function(){
      var open=body.classList.contains('jcd-mnav-open');
      Array.prototype.forEach.call(body.children,function(el){
        if(el===mnav||el===burger||el.tagName==='SCRIPT'||el.tagName==='STYLE'){ return; }
        if(open){ el.setAttribute('inert',''); } else { el.removeAttribute('inert'); }
      });
    }).observe(body,{attributes:true,attributeFilter:['class']}); }catch(e){}
  }
  /* 3) floating cluster on long pages */
  var toTop=d.getElementById('jcdToTop');
  if(fab){
    var update=function(){
      var y=window.pageYOffset||d.documentElement.scrollTop||0;
      var docH=d.documentElement.scrollHeight, vh=window.innerHeight||0;
      var nearBottom=(y+vh)>(docH-200);
      if(y>520 && !nearBottom){ fab.classList.add('is-shown'); } else { fab.classList.remove('is-shown'); }
      if(toTop){ if(y>520){ toTop.classList.add('is-on'); } else { toTop.classList.remove('is-on'); } }
    };
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update,{passive:true});
    update();
  }
  if(toTop){ toTop.addEventListener('click',function(){ var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches; try{ window.scrollTo({top:0,behavior:rm?'auto':'smooth'}); }catch(e){ window.scrollTo(0,0); } }); }
  /* 4) hide the contact shortcut on the contact page itself */
  var cf=d.getElementById('jcdFabContact');
  if (cf && /contact\(\?|$)/.test(location.pathname + location.search)) {
    if (cf.parentNode) {
      cf.parentNode.removeChild(cf);
    }
  }
  /* 5) mobile keyboard refinements */
  try{
    Array.prototype.forEach.call(d.querySelectorAll('input[type="email"]'),function(i){ i.setAttribute('inputmode','email'); i.setAttribute('enterkeyhint','next'); });
    Array.prototype.forEach.call(d.querySelectorAll('input[type="tel"]'),function(i){ i.setAttribute('inputmode','tel'); });
    Array.prototype.forEach.call(d.querySelectorAll('textarea'),function(t){ t.setAttribute('enterkeyhint','enter'); });
  }catch(e){}
})();
