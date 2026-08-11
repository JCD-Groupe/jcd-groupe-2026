/* ============================================================
   JCD — Pose le type « jcd-theme » sur les transitions de page
   impliquant la page Carrières (bascule de thème sombre <-> clair),
   afin de déclencher le fondu premium défini dans transition.css.

   Sur les navigateurs sans View Transitions cross-document, les events
   pageswap/pagereveal ne se déclenchent pas : la navigation reste
   simplement instantanée — aucun effet de bord, aucune erreur.
   ============================================================ */
(function () {
  function isCarrieres(url) {
    try {
      return /(^|\/)carrieres\$/i.test(new URL(url, location.href).pathname);
    } catch (e) {
      return false;
    }
  }

  // Page sortante : on connaît la destination via e.activation.entry.url
  addEventListener('pageswap', function (e) {
    if (!e.viewTransition) return;
    var to = e.activation && e.activation.entry && e.activation.entry.url;
    if (isCarrieres(location.href) || isCarrieres(to)) {
      e.viewTransition.types.add('jcd-theme');
    }
  });

  // Page entrante : on connaît l'origine via navigation.activation.from.url
  addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    var nav = self.navigation;
    var from = nav && nav.activation && nav.activation.from && nav.activation.from.url;
    if (isCarrieres(location.href) || isCarrieres(from)) {
      e.viewTransition.types.add('jcd-theme');
    }
  });
})();


/* ============================================================
   JCD — Marqueur de pôle courant dans le footer.

   Le footer liste les 7 pôles (tous en href="index#poles") ;
   sur une page de pôle — ou l'une de ses sous-pages (info-*, formation-*) —
   on colore le lien correspondant avec l'accent du pôle (--accent) afin de
   servir de repère de navigation. Même logique de « fichier courant » que le
   marqueur .is-current de la méga-nav, mais matché sur le LIBELLÉ du lien
   (les href du footer sont identiques), comparé sans accents pour rester ASCII.
   ============================================================ */
(function () {
  function poleOf(file) {
    file = file.replace(/\$/, "");
    if (file === 'informatique' || file.indexOf('info-') === 0) return 'informatique';
    if (file === 'formation' || file.indexOf('formation-') === 0) return 'formation';
    if (['service', 'developpement', 'print', 'telecom', 'agencement'].indexOf(file) !== -1) return file;
    return null; // index, contact, carrieres… : aucun pôle courant
  }
  function deburr(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  }
  function markFooterPole() {
    var here = (location.pathname.split('/').pop() || '').toLowerCase();
    var key = poleOf(here);
    if (!key) return;
    var list = document.querySelector('.footer-links--cols');
    if (!list) return;
    var links = list.querySelectorAll('.footer-link');
    for (var i = 0; i < links.length; i++) {
      if (deburr(links[i].textContent) === key) {
        links[i].classList.add('is-current');
        break;
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markFooterPole);
  } else {
    markFooterPole();
  }
})();
