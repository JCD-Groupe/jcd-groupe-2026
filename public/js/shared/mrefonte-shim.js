/* Mobile <=820px : force les chemins reduced-motion du site (WebGL hero + typewriter off).
   Les fallbacks statiques par pole prennent le relais. Identique au shim mpolish retire en juin. */
(function(){
  try{
    if (window.innerWidth > 820) return;
    if (window.__jcdRmShim) return; window.__jcdRmShim = 1;
    var native = window.matchMedia;
    if (typeof native !== 'function') return;
    window.matchMedia = function(q){
      if (typeof q === 'string' && q.indexOf('prefers-reduced-motion') !== -1 && q.indexOf('reduce') !== -1){
        return { matches:true, media:q, onchange:null,
          addListener:function(){}, removeListener:function(){},
          addEventListener:function(){}, removeEventListener:function(){},
          dispatchEvent:function(){ return false; } };
      }
      return native.call(window, q);
    };
  }catch(e){}
})();
