(function(){
  function run(){
    try{
      if(window.innerWidth>820) return;
      var items=document.querySelectorAll('.fp-step, .bp-step, .regie-steps .clip, .atelier-steps .station');
      Array.prototype.forEach.call(items, function(it){
        var desc=it.querySelector('p'); if(!desc) return;
        it.setAttribute('role','button'); it.setAttribute('tabindex','0'); it.setAttribute('aria-expanded','false');
        var toggle=function(){ var open=it.classList.toggle('jcd-iopen'); it.setAttribute('aria-expanded',open?'true':'false'); desc.style.maxHeight=open?(desc.scrollHeight+'px'):'0px'; };
        it.addEventListener('click',toggle);
        it.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
      });
    }catch(e){}
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',run); } else { run(); }
})();
