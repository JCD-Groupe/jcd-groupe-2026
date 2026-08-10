/* prefers-reduced-motion : on n'engage pas les 11 Mo, le poster suffit */
        (function(){try{var v=document.getElementById('hero-video'),s=v&&v.querySelector('source');if(v&&s&&window.matchMedia('(prefers-reduced-motion:reduce)').matches){v.preload='none';s.parentNode.removeChild(s);v.load();}}catch(e){}})();
