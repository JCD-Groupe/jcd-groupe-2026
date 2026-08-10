(function(){
  function run(){
    try{
      if(window.innerWidth>820) return;
      /* Regression : ressortir .sky-offer de l'illustration .skywatch masquee (info-cloud) */
      var so=document.querySelector('.sky-offer');
      if(so){
        var hidden=so.closest('.skywatch');
        var head=document.querySelector('.secblock .secblock-head') || document.querySelector('.secblock-head');
        if(hidden && head){ head.insertAdjacentElement('afterend', so); }
      }
    }catch(e){}
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',run); } else { run(); }
})();
