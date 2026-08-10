(function(){
  function run(){
    try{
      var isMobile = window.innerWidth <= 820;
      var defs = [['Prestations','#prestations'],['M\u00e9thode','#process'],['Contact','#contact']];
      var links = defs.filter(function(d){ return document.querySelector(d[1]); });
      if (links.length && !document.querySelector('.jcd-xpnav')){
        var nav=document.createElement('nav'); nav.className='jcd-xpnav'; nav.setAttribute('aria-label','Sections de la page');
        links.forEach(function(d){ var a=document.createElement('a'); a.href=d[1]; var dot=document.createElement('span'); dot.className='jcd-xpdot'; dot.setAttribute('aria-hidden','true'); a.appendChild(dot); a.appendChild(document.createTextNode(d[0])); nav.appendChild(a); });
        var main=document.querySelector('main')||document.body; var hero=main.querySelector('section'); if(hero){ hero.insertAdjacentElement('afterend',nav); } else { main.insertBefore(nav,main.firstChild); }
      }
      if (isMobile){
        var partners=document.querySelector('.prest-aside-partners'); var layout=document.querySelector('.prest-layout');
        if(partners && layout){ layout.appendChild(partners); }
        var wire=function(sel, descSel){
          Array.prototype.forEach.call(document.querySelectorAll(sel), function(it){
            var desc=it.querySelector(descSel); if(!desc) return;
            it.setAttribute('role','button'); it.setAttribute('tabindex','0'); it.setAttribute('aria-expanded','false');
            var toggle=function(){ var open=it.classList.toggle('jcd-open'); it.setAttribute('aria-expanded',open?'true':'false'); desc.style.maxHeight=open?(desc.scrollHeight+'px'):'0px'; };
            it.addEventListener('click',toggle);
            it.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
          });
        };
        wire('.prest-item','.prest-item-desc');
        wire('.pf-vcard','.pf-vcard-desc');
      }
    }catch(e){}
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',run); } else { run(); }
})();
