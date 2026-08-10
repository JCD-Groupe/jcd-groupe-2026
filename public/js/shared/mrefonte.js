(function(){
  function run(){
    try{
      if (document.getElementById('jcd-mbar')) return;
      var body = document.body;
      var mkIcon = function(d){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
      /* Barre d'actions fixe en bas */
      var bar = document.createElement('nav');
      bar.id = 'jcd-mbar';
      bar.setAttribute('aria-label','Actions rapides');
      var menuBtn = document.createElement('button');
      menuBtn.type = 'button'; menuBtn.className = 'jcd-mbar-menu';
      menuBtn.setAttribute('aria-controls','jcdMnav');
      menuBtn.innerHTML = mkIcon('<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>') + '<span>Menu</span>';
      menuBtn.addEventListener('click', function(){
        var b = document.getElementById('jcdBurger');
        if (b) b.click();
      });
      var tel = document.createElement('a');
      tel.href = 'tel:+33387184920';
      tel.innerHTML = mkIcon('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>') + '<span>Appeler</span>';
      var cta = document.createElement('a');
      cta.className = 'jcd-mbar-cta';
      cta.href = 'contact.html';
      cta.innerHTML = mkIcon('<path d="M4 4h16v12H7l-3 3z"/>') + '<span>Contact</span>';
      if (/contact\.html$/i.test(location.pathname)) cta.setAttribute('aria-current','page');
      bar.appendChild(menuBtn); bar.appendChild(tel); bar.appendChild(cta);
      body.appendChild(bar);
      body.classList.add('jcd-has-mbar');
      /* Label Menu <-> Fermer suit l'etat de l'overlay (classe body posee par le script mnav) */
      var lab = menuBtn.querySelector('span');
      var sync = function(){
        var open = body.classList.contains('jcd-mnav-open');
        lab.textContent = open ? 'Fermer' : 'Menu';
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      sync();
      if (window.MutationObserver){ new MutationObserver(sync).observe(body, { attributes:true, attributeFilter:['class'] }); }
      /* Competences + methode : plus d'accordeon sur mobile -> retire les roles/tabindex poses par xpcompact */
      if (window.innerWidth <= 820){
        Array.prototype.forEach.call(document.querySelectorAll('.prest-item, .pf-vcard, .fp-step, .bp-step, .regie-steps .clip, .atelier-steps .station'), function(it){
          it.removeAttribute('role'); it.removeAttribute('tabindex'); it.removeAttribute('aria-expanded');
        });
      }
      /* Sommaire d'ancres (chips) : SUPPRIME sur demande user 2026-07-15 \u2014 retire ceux du DOM (xpcompact) */
      Array.prototype.forEach.call(document.querySelectorAll('.jcd-xpnav'), function(nav){
        if (nav.parentNode) nav.parentNode.removeChild(nav);
      });
      /* Murs de logos -> bande unique : retire les doublons (sets dupliques pour la boucle marquee) */
      if (window.innerWidth <= 820){
        var seen = {};
        Array.prototype.forEach.call(document.querySelectorAll('.logo-marquee-item, .clients-row__item'), function(it){
          var img = it.querySelector('img'); if (!img) return;
          var key = img.getAttribute('src') || img.getAttribute('title') || '';
          if (seen[key]){ it.style.display = 'none'; } else { seen[key] = 1; }
        });
      }
    }catch(e){}
  }
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', run); } else { run(); }
})();
