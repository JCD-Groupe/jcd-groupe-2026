  /* Marquee smooth : décélération / réaccélération du mur de logos.
     `animation-play-state: paused` coupe net ; on pilote à la place le
     playbackRate de l'animation CSS via la Web Animations API, rampé
     frame par frame. Le playbackRate ne réinitialise pas la progression
     de l'animation : les logos ralentissent puis repartent d'où ils
     sont, sans le moindre saut de position. */
  (function setupMarqueeGlide() {
    var marquees = document.querySelectorAll('.clients-marquee');
    if (!marquees.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var SLOWDOWN = 900;   /* ms pour une course pleine 1 -> 0 */
    var SPEEDUP  = 1100;  /* ms pour une course pleine 0 -> 1 */

    /* Freinage : ease-out cubic — perd l'essentiel de sa vitesse tôt,
       puis glisse longuement jusqu'à l'arrêt.
       Relance : ease-in-out cubic — redémarre en douceur, sans à-coup. */
    function easeOut(t)   { return 1 - Math.pow(1 - t, 3); }
    function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    Array.prototype.forEach.call(marquees, function (marquee) {
      var rows = marquee.querySelectorAll('.clients-row');
      if (!rows.length || typeof rows[0].getAnimations !== 'function') return;

      /* Neutralise le repli CSS : à partir d'ici le JS possède l'arrêt. */
      marquee.classList.add('jcd-marquee-smooth');

      var anims = null;
      /* Résolution paresseuse : au premier survol les animations CSS
         sont forcément démarrées, ce qui évite toute course au chargement. */
      function getAnims() {
        if (anims && anims.length) return anims;
        anims = [];
        Array.prototype.forEach.call(rows, function (row) {
          Array.prototype.forEach.call(row.getAnimations(), function (a) {
            if (!a.animationName || a.animationName === 'clients-marquee') anims.push(a);
          });
        });
        return anims;
      }

      var rafId = null, rate = 1, from = 1, target = 1, startedAt = 0, dur = SLOWDOWN, ease = easeOut;

      function apply(r) {
        rate = r;
        var list = getAnims();
        for (var i = 0; i < list.length; i++) {
          try { list[i].playbackRate = r; } catch (e) {}
        }
      }

      function step(now) {
        var t = dur > 0 ? Math.min(1, (now - startedAt) / dur) : 1;
        apply(from + (target - from) * ease(t));
        rafId = t < 1 ? requestAnimationFrame(step) : null;
      }

      function rampTo(value, fullDuration, easing) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        from = rate;
        target = value;
        /* Durée proportionnelle à la course restante : sortir du survol
           en pleine décélération relance sans temps mort. */
        dur = fullDuration * Math.abs(target - from);
        ease = easing;
        startedAt = performance.now();
        if (dur <= 0) { apply(target); return; }
        rafId = requestAnimationFrame(step);
      }

      function slow() { rampTo(0, SLOWDOWN, easeOut); }
      function resume() { rampTo(1, SPEEDUP, easeInOut); }

      marquee.addEventListener('mouseenter', slow);
      marquee.addEventListener('mouseleave', resume);
      marquee.addEventListener('focusin', slow);
      marquee.addEventListener('focusout', function () {
        if (!marquee.contains(document.activeElement)) resume();
      });
    });
  })();
