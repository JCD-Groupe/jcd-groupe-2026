(function(){
  var body=document.body,burger=document.getElementById('jcdBurger'),mnav=document.getElementById('jcdMnav'),hroot=document.documentElement;
  if(!burger||!mnav)return;
  var lastFocus=null;
  function focusables(){return mnav.querySelectorAll('a[href],button:not([disabled])');}
  function open(){
    lastFocus=document.activeElement;
    body.classList.add('jcd-mnav-open');
    burger.setAttribute('aria-expanded','true');burger.setAttribute('aria-label','Fermer le menu');
    mnav.setAttribute('aria-hidden','false');
    body.style.overflow='hidden';hroot.style.overflow='hidden';
  }
  function close(){
    body.classList.remove('jcd-mnav-open');
    burger.setAttribute('aria-expanded','false');burger.setAttribute('aria-label','Ouvrir le menu');
    mnav.setAttribute('aria-hidden','true');
    body.style.overflow='';hroot.style.overflow='';
    if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}
  }
  function toggle(){body.classList.contains('jcd-mnav-open')?close():open();}
  burger.addEventListener('click',toggle);
  mnav.addEventListener('click',function(e){var a=e.target.closest('a');if(a)close();});
  document.addEventListener('keydown',function(e){
    if(!body.classList.contains('jcd-mnav-open'))return;
    if(e.key==='Escape'){close();return;}
    if(e.key==='Tab'){
      var f=focusables();if(!f.length)return;var first=f[0],last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  Array.prototype.forEach.call(mnav.querySelectorAll('.jcd-acc__toggle'),function(btn){
    btn.addEventListener('click',function(){
      var p=document.getElementById(btn.getAttribute('aria-controls'));if(!p)return;
      var isOpen=p.style.maxHeight&&p.style.maxHeight!=='0px';
      if(isOpen){p.style.maxHeight='0px';btn.setAttribute('aria-expanded','false');}
      else{p.style.maxHeight=p.scrollHeight+'px';btn.setAttribute('aria-expanded','true');}
    });
  });
  window.addEventListener('resize',function(){if(window.innerWidth>820&&body.classList.contains('jcd-mnav-open'))close();});
})();
