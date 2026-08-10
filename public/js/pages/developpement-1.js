/* Aperçu projet : carousel d'images (realisations/<slug>-1..N.jpg) + description
   longue. La page passe en flou gaussien (backdrop-filter). Repli logo si les
   captures ne sont pas encore déposées. */
(function () {
  var DATA = {
    'selfbeton':    { sub: "Automatisation du parcours client", body: "Interface sur mesure pour bornes tactiles de commande avec configuration et gestion à distance. Paiement par CB ou badge NFC. Caisse connectée en complément des bornes. Communication avec l'automate de distribution via QR code sécurisé.", imgs: 4 },
    'lavoir-adele': { sub: "Réservation & gestion d'avis", body: "Réservation en ligne et présentation du logement. Demande d'avis client post-séjour et mise en ligne automatique.", imgs: 4 },
    'stillprovide': { sub: "Assistance à la vente à domicile", body: "Prise et suivi de rendez-vous, édition assistée de contrats. Gestion complète de l'agenda : rendez-vous, disponibilités et indisponibilités. Suivi des statistiques et des gains personnels.", imgs: 4 },
    'cormontaigne': { sub: "Présence en ligne", body: "Présentation de l'entreprise et de son activité. Inscription à des webinaires et prise de rendez-vous téléphonique.", imgs: 4 },
    'arkema':       { sub: "Suivi de stock & calculateur de mélanges", body: "Outil de suivi de stock de poudre empilée en silo. Calculateur complexe de création de mélange de poudre.", imgs: 4 },
    'thimo':        { sub: "E-commerce décoration & architecture d'intérieur", body: "E-commerce d'objets de décoration avec paiement et aide à la création d'étiquettes de livraison. Présentation de l'activité parallèle d'architecture d'intérieur et présence en ligne.", imgs: 4 },
    'virenov':      { sub: "Plateforme installateurs", body: "Suivi de dossiers avec les installateurs prestataires, gestion et partage de documents complets et automatisés. Outils selon le type de projet : démarches administratives (CEE, PV, financement), calculettes d'aides et d'emprunt, comparateurs fournisseur et isolant, formations, qualifications, certifications, audit énergétique et DPE.", imgs: 4 },
    'univac':       { sub: "Réservation hôtelière en ligne", body: "Réservation en ligne de chambres d'hôtel. Présentation des hôtels et présence en ligne.", imgs: 4 },
    'viessmann':    { sub: "Catalogue & calculateur ECS", body: "Catalogue produit mis à disposition de tous avec documentation technique. Algorithme de calcul de la production d'eau chaude sanitaire la plus adaptée aux besoins client, offrant un gain de temps aux commerciaux et un accès direct aux prestataires installateurs.", imgs: 4 },
    'synapse':      { sub: "Extranet médical", body: "Amélioration de la lecture des données patient : centralisation des données, indicateurs d'aide visuels, graphiques. Aide à la saisie et à la signature de documents.", imgs: 4 },
    'tarte-sucre':  { sub: "Click & collect", body: "Click and collect sur une partie du catalogue. Mise en avant de l'ensemble du catalogue et présence en ligne.", imgs: 4 },
    'liteyear':     { sub: "Outil d'aide à la vente", body: "Édition assistée de nouveaux contrats et suivi de ces derniers. Synchronisation avec les données fournisseurs pour un suivi complet des contrats. Suivi des performances et de la qualité des commerciaux.", imgs: 4 }
  };

  var modal = document.getElementById('rp-modal');
  if (!modal) return;
  var grid = document.getElementById('real-grid');
  var track = document.getElementById('rp-track');
  var dotsRow = document.getElementById('rp-dots');
  var counter = document.getElementById('rp-counter');
  var carousel = document.getElementById('rp-carousel');
  var dialog = modal.querySelector('.rp-dialog');
  var idx = 0, slides = [], fb = null, lastFocus = null;

  function pad(n) { n = String(n); return n.length < 2 ? '0' + n : n; }

  function visList() {
    var v = slides.filter(function (s) { return !s.classList.contains('is-missing'); });
    if (v.length) { if (fb) fb.classList.add('is-missing'); return v; }
    if (fb) fb.classList.remove('is-missing');
    return fb ? [fb] : [];
  }

  function buildDots() {
    dotsRow.innerHTML = '';
    visList().forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rp-dot' + (i === idx ? ' is-active' : '');
      b.setAttribute('aria-label', 'Image ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      dotsRow.appendChild(b);
    });
  }

  function render() {
    var vis = visList();
    carousel.classList.toggle('is-single', vis.length <= 1);
    if (!vis.length) { counter.innerHTML = '<b>01</b> / 01'; return; }
    if (idx >= vis.length) idx = vis.length - 1;
    if (idx < 0) idx = 0;
    track.style.transform = 'translateX(-' + vis[idx].offsetLeft + 'px)';
    counter.innerHTML = '<b>' + pad(idx + 1) + '</b> / ' + pad(vis.length);
    Array.prototype.forEach.call(dotsRow.children, function (d, i) {
      d.classList.toggle('is-active', i === idx);
    });
  }

  function go(n) {
    var vis = visList();
    if (!vis.length) return;
    idx = (n + vis.length) % vis.length;
    render();
  }

  function open(card) {
    var slug = card.getAttribute('data-project');
    var d = DATA[slug];
    if (!d) return false;
    lastFocus = document.activeElement;

    document.getElementById('rp-title').innerHTML = card.querySelector('.real-title').innerHTML;
    document.getElementById('rp-eyebrow').textContent = card.querySelector('.real-tag').textContent.trim();
    document.getElementById('rp-bar-title').innerHTML = 'projet · <span class="accent">' + slug + '</span>';
    document.getElementById('rp-sub').textContent = d.sub;
    document.getElementById('rp-desc').textContent = d.body;

    var tech = document.getElementById('rp-tech');
    tech.innerHTML = '';
    Array.prototype.forEach.call(card.querySelectorAll('.real-tech li:not(.real-tech-more)'), function (li) {
      var x = document.createElement('li');
      x.textContent = li.textContent;
      tech.appendChild(x);
    });

    /* slides captures */
    track.innerHTML = '';
    slides = [];
    for (var i = 1; i <= d.imgs; i++) {
      (function (n) {
        var sl = document.createElement('div');
        sl.className = 'rp-slide';
        var im = document.createElement('img');
        im.alt = ''; im.decoding = 'async';
        im.src = 'realisations/' + slug + '-' + n + '.jpg';
        im.addEventListener('error', function () {
          sl.classList.add('is-missing');
          buildDots();
          render();
        });
        sl.appendChild(im);
        track.appendChild(sl);
        slides.push(sl);
      })(i);
    }
    /* repli logo (révélé seulement si aucune capture ne charge) */
    fb = document.createElement('div');
    fb.className = 'rp-slide rp-slide--logo is-missing';
    var lim = document.createElement('img');
    var srcLogo = card.querySelector('.real-logo');
    lim.alt = srcLogo ? srcLogo.alt : '';
    lim.src = 'realisations/logo-' + slug + '.png';
    fb.appendChild(lim);
    track.appendChild(fb);

    idx = 0;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('rp-locked');

    requestAnimationFrame(function () {
      buildDots();
      render();
      dialog.focus();
    });
    return true;
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('rp-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (grid) {
    grid.addEventListener('click', function (e) {
      var link = e.target.closest('.real-card-link');
      if (!link) return;
      var card = link.closest('.real-card');
      if (card && DATA[card.getAttribute('data-project')]) {
        e.preventDefault();
        open(card);
      }
    });
  }

  document.getElementById('rp-prev').addEventListener('click', function () { go(idx - 1); });
  document.getElementById('rp-next').addEventListener('click', function () { go(idx + 1); });
  document.getElementById('rp-close').addEventListener('click', close);
  Array.prototype.forEach.call(modal.querySelectorAll('[data-rp-close]'), function (el) {
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
  });
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') go(idx - 1);
    else if (e.key === 'ArrowRight') go(idx + 1);
  });
  window.addEventListener('resize', function () {
    if (modal.classList.contains('is-open')) render();
  });
})();
