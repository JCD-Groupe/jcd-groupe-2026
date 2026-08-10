/* Mobile: force the reduced-motion code paths so the WebGL hero + typewriter never start
   (real CPU/GPU/battery saving). transition.js does NOT read this query, so page fades stay. */
(function(){
  try{
    if (window.innerWidth > 820) return;
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
