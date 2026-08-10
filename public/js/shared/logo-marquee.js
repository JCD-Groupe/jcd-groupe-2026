  // Marquee logos : couture -50% exacte (espacement en margin-bottom, pas en gap)
  // + densification auto : si un demi-set est plus court que le cadre, on clone des
  //   sets (aria-hidden) et on allonge la duree d autant -> vitesse percue constante,
  //   aucun vide au chargement ni en cours de boucle, a tous les viewports.
  (function fillLogoMarquee() {
    var cols = document.querySelectorAll('.logo-marquee-col');
    if (!cols.length) return;
    [].forEach.call(cols, function (col) {
      var kids = [].slice.call(col.children);
      if (kids.length < 2) return;
      var N = Math.floor(kids.length / 2);
      var setH = kids[N].offsetTop - kids[0].offsetTop;
      if (setH <= 0) return;
      var box = col.parentElement.clientHeight;
      var m = Math.max(1, Math.ceil((box + 40) / setH));
      if (m > 1) {
        var frag = document.createDocumentFragment();
        for (var c = 0; c < 2 * (m - 1); c++) {
          for (var i = 0; i < N; i++) {
            var cl = kids[i].cloneNode(true);
            cl.setAttribute('aria-hidden', 'true');
            frag.appendChild(cl);
          }
        }
        col.appendChild(frag);
        var d = parseFloat(getComputedStyle(col).animationDuration) || 28;
        col.style.animationDuration = (d * m) + 's';
      }
    });
  })();
