(function(){
  function init(){
    try{
      var track=document.getElementById('offers-list');
      if(!track || document.querySelector('.jcd-moffers-dots')) return;
      var dots=document.createElement('div');
      dots.className='jcd-moffers-dots';
      track.insertAdjacentElement('afterend',dots);
      var cards=[];
      function cardLeft(i){ return cards[i] ? (cards[i].offsetLeft - cards[0].offsetLeft) : 0; }
      function current(){
        var x=track.scrollLeft, best=0, bd=Infinity;
        for(var i=0;i<cards.length;i++){ var d=Math.abs(cardLeft(i)-x); if(d<bd){ bd=d; best=i; } }
        return best;
      }
      function update(){
        var cur=current();
        Array.prototype.forEach.call(dots.children,function(b,i){ b.classList.toggle('is-on',i===cur); });
      }
      function rebuild(){
        cards=Array.prototype.slice.call(track.querySelectorAll('.offer-card'));
        dots.innerHTML='';
        if(cards.length<2){ dots.style.display='none'; return; }
        dots.style.display='';
        cards.forEach(function(c,i){
          var b=document.createElement('button'); b.type='button';
          b.setAttribute('aria-label','Aller \u00e0 l\u2019offre '+(i+1)+' sur '+cards.length);
          /* defilement instantane : snap-stop always + smooth bloquent les sauts multi-cartes */
          b.addEventListener('click',function(){ track.scrollTo({left:cardLeft(i)}); });
          dots.appendChild(b);
        });
        update();
      }
      var raf=null;
      track.addEventListener('scroll',function(){
        if(raf) return;
        raf=requestAnimationFrame(function(){ raf=null; update(); });
      },{passive:true});
      /* fallback : certains contextes ne dispatchent pas 'scroll' -> poll leger, update seulement si ca a bouge */
      var lastX=-1;
      setInterval(function(){ if(track.scrollLeft!==lastX){ lastX=track.scrollLeft; update(); } },150);
      window.addEventListener('resize',update);
      new MutationObserver(rebuild).observe(track,{childList:true});
      rebuild();
    }catch(e){}
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); } else { init(); }
})();
