  /* ====================================================================
     QUESTIONNAIRE CONTACT — moteur multi-pôles, 3 étapes.
     · Génère les cartes-pôles (étape 1) et les blocs adaptatifs
       (étape 2) à partir d'une source de données unique POLES.
     · Pré-sélection contextuelle via l'URL (?pole=telecom,informatique
       et ?intent=assistance).
     · Validation côté client + envoi unifié tagué vers Web3Forms.
     ==================================================================== */
  (function setupQuestionnaire() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
    var ECH_DEFAULT = ['Urgent', 'Ce mois-ci', 'Ce trimestre', 'À planifier'];

    var POLES = [
      { id: 'informatique', name: 'Informatique', sub: 'Parc, cloud & collaboration',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
        types: ['Parc & matériel', 'Cloud & hébergement', 'Collaboration & audiovisuel', 'Cybersécurité'],
        echeances: ECH_DEFAULT },
      { id: 'service', name: 'Service', sub: 'Support & proximité',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 14v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2zM3 14v3a2 2 0 0 0 2 2h1v-7H5a2 2 0 0 0-2 2z"/></svg>',
        types: ['Incident en cours', 'Maintenance / contrat', 'Infogérance', 'Question'],
        echeances: ['Bloquant (à l’arrêt)', 'Gênant', 'Non urgent'] },
      { id: 'developpement', name: 'Développement', sub: 'Logiciels sur mesure',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 4l-4 16"/></svg>',
        types: ['Application métier', 'Site / web app', 'Intégration & API', 'Refonte d’existant'],
        echeances: ECH_DEFAULT },
      { id: 'print', name: 'Print', sub: 'Impression & reprographie',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 17h10v4H7z"/><circle cx="17" cy="13" r="0.8" fill="currentColor"/></svg>',
        types: ['Parc d’impression', 'Copieurs / MFP', 'Contrat & consommables', 'GED'],
        echeances: ECH_DEFAULT },
      { id: 'telecom', name: 'Télécom', sub: 'Téléphonie d’entreprise',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.29a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>',
        types: ['Téléphonie IP', 'Mobile & forfaits', 'Standard / ToIP', 'Connectivité fibre'],
        echeances: ECH_DEFAULT },
      { id: 'formation', name: 'Formation', sub: 'Monter en compétences',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c2 2 4 3 6 3s4-1 6-3v-5"/></svg>',
        types: ['Bureautique', 'Logiciels métier', 'Cybersécurité & sensibilisation', 'Sur mesure'],
        echeances: ECH_DEFAULT },
      { id: 'agencement', name: 'Agencement', sub: 'Espaces de travail',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18v3M20 18v3M3 8h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM6 8V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/></svg>',
        types: ['Poste de travail', 'Salle de réunion & visio', 'Câblage / infra', 'Espace complet'],
        echeances: ECH_DEFAULT },
      { id: 'servicesgeneraux', name: 'Services généraux', sub: 'Communication, direction, RH…', light: true,
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M16 21V9h3a2 2 0 0 1 2 2v10"/><path d="M9 7h2M9 11h2M9 15h2"/></svg>',
        types: ['Communication', 'Direction', 'Ressources humaines', 'Autre service'],
        echeances: ECH_DEFAULT }
    ];

    var POLE_BY_ID = {};
    POLES.forEach(function (p) { POLE_BY_ID[p.id] = p; });

    /* ---- Références DOM ---- */
    var grid       = document.getElementById('pole-grid');
    var countEl    = document.getElementById('q-pole-count');
    var toStep2    = document.getElementById('to-step-2');
    var recapEl    = document.getElementById('q-recap');
    var steps      = [null,
      document.getElementById('q-step-1'),
      document.getElementById('q-step-2')];
    var progFill   = document.getElementById('q-progress-fill');
    var progSteps  = form.querySelectorAll('.q-progress-step');
    var errorEl    = document.getElementById('q-error');
    var submitBtn  = document.getElementById('q-submit');
    var successEl  = document.getElementById('q-success');
    var shell      = form;

    var intentOpts = form.querySelectorAll('.q-intent-opt');
    var glider     = form.querySelector('.q-intent-glider');

    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var currentStep = 1;
    var currentIntent = 'projet';

    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    /* ---- 1. Rendu des cartes-pôles ---- */
    function renderPoleCards() {
      grid.innerHTML = POLES.map(function (p) {
        return '<label class="pole-card' + (p.light ? ' pole-card--light' : '') + '" style="--pc: var(--c-' + p.id + ')">' +
          '<input type="checkbox" name="pole" value="' + p.id + '" aria-label="' + esc(p.name) + ' — ' + esc(p.sub) + '">' +
          '<span class="pole-ico" aria-hidden="true">' + p.icon + '</span>' +
          '<span class="pole-tx"><span class="pole-name">' + esc(p.name) + '</span>' +
          '<span class="pole-sub">' + esc(p.sub) + '</span></span>' +
          '<span class="pole-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>' +
          '</label>';
      }).join('');
    }

    function selectedPoleIds() {
      return Array.prototype.slice
        .call(grid.querySelectorAll('input[name="pole"]:checked'))
        .map(function (i) { return i.value; });
    }

    function updateCount() {
      var n = selectedPoleIds().length;
      countEl.textContent = n === 0 ? 'Aucun pôle sélectionné'
        : n + (n === 1 ? ' pôle sélectionné' : ' pôles sélectionnés');
    }

    /* ---- 3. Récapitulatif (étape 3 + confirmation) ---- */
    function recapHTML() {
      var ids = selectedPoleIds();
      if (!ids.length) {
        return '<span class="recap-chip">Toute l’équipe JCD</span>';
      }
      return ids.map(function (id) {
        var p = POLE_BY_ID[id];
        return '<span class="recap-chip" style="--pc: var(--c-' + p.id + ')">' + esc(p.name) + '</span>';
      }).join('');
    }
    function renderRecap() { recapEl.innerHTML = recapHTML(); }

    /* ---- 4. Navigation entre étapes ---- */
    function reflow(el) {
      if (prefersReduced) return;
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    }
    function showStep(n) {
      currentStep = n;
      for (var i = 1; i <= 2; i++) {
        if (i === n) { steps[i].hidden = false; reflow(steps[i]); }
        else { steps[i].hidden = true; }
      }
      progFill.style.transform = 'scaleX(' + (n / 2) + ')';
      progSteps.forEach(function (li) {
        var s = parseInt(li.getAttribute('data-pstep'), 10);
        li.classList.toggle('is-active', s === n);
        li.classList.toggle('is-done', s < n);
      });
      var title = steps[n].querySelector('.q-step-title');
      if (title) title.focus();
      try { shell.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' }); } catch (e) { shell.scrollIntoView(); }
    }

    /* ---- 5. Sélecteur d'intention ---- */
    function moveGlider() {
      var active = form.querySelector('.q-intent-opt.is-selected');
      if (!active || !glider) return;
      glider.style.width = active.offsetWidth + 'px';
      glider.style.transform = 'translateX(' + (active.offsetLeft - 4) + 'px)';
    }
    function setIntent(intent) {
      currentIntent = intent;
      intentOpts.forEach(function (o) {
        var on = o.getAttribute('data-intent') === intent;
        o.classList.toggle('is-selected', on);
        o.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      moveGlider();
    }
    intentOpts.forEach(function (o) {
      o.addEventListener('click', function () {
        setIntent(o.getAttribute('data-intent'));
        if (o.getAttribute('data-intent') === 'assistance') {
          var svc = grid.querySelector('input[value="service"]');
          if (svc && !svc.checked) { svc.checked = true; updateCount(); }
        }
      });
    });
    window.addEventListener('resize', moveGlider);

    /* ---- 6. Pré-sélection contextuelle via l'URL ---- */
    function applyURLParams() {
      var params = new URLSearchParams(window.location.search);
      var poleParam = params.get('pole');
      var intentParam = params.get('intent');

      if (poleParam) {
        poleParam.split(',').forEach(function (raw) {
          var id = raw.trim().toLowerCase();
          var input = grid.querySelector('input[value="' + id + '"]');
          if (input) input.checked = true;
        });
      }
      if (intentParam === 'assistance') {
        setIntent('assistance');
        var svc = grid.querySelector('input[value="service"]');
        if (svc) svc.checked = true;
      } else if (intentParam === 'carrieres') {
        var msg = document.getElementById('f-message');
        if (msg) msg.value = 'Bonjour, je souhaite rejoindre le Groupe JCD (candidature spontanée). ';
      }
      updateCount();
    }

    /* ---- 7. Construction de la charge utile ---- */
    function buildDetails(ids) {
      var lines = [];
      lines.push('Type de demande : ' + (currentIntent === 'assistance' ? 'Assistance (client existant)' : 'Nouveau projet / question'));
      lines.push('Pôles sollicités : ' + (ids.length ? ids.map(function (id) { return POLE_BY_ID[id].name; }).join(', ') : 'Non précisé (demande générale)'));
      return lines.join('\n');
    }
    function buildSubject(ids, company, name) {
      var tags = ids.map(function (id) { return '[' + POLE_BY_ID[id].name.toUpperCase() + ']'; }).join('');
      var who = (company && company.trim()) || (name && name.trim()) || 'Nouvelle demande';
      return (tags ? tags + ' ' : '') + who + (currentIntent === 'assistance' ? ' — Assistance' : ' — Contact');
    }

    /* ---- 8. Validation (étape 3) ---- */
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    function setFieldError(id, on) {
      var field = document.getElementById(id);
      if (field) field.closest('.q-field').classList.toggle('has-error', on);
    }
    function validate() {
      var name = document.getElementById('f-name');
      var email = document.getElementById('f-email');
      var message = document.getElementById('f-message');
      var consent = document.getElementById('f-consent');
      var problems = [];
      var firstBad = null;

      var nameOk = name.value.trim().length > 0;
      var emailOk = EMAIL_RE.test(email.value.trim());
      var msgOk = message.value.trim().length > 0;
      setFieldError('f-name', !nameOk);
      setFieldError('f-email', !emailOk);
      setFieldError('f-message', !msgOk);
      if (!nameOk) { problems.push('votre nom'); firstBad = firstBad || name; }
      if (!emailOk) { problems.push('un email valide'); firstBad = firstBad || email; }
      if (!msgOk) { problems.push('un message'); firstBad = firstBad || message; }
      if (!consent.checked) { problems.push('votre consentement'); firstBad = firstBad || consent; }

      if (problems.length) {
        errorEl.textContent = 'Merci de renseigner : ' + problems.join(', ') + '.';
        errorEl.hidden = false;
        if (firstBad) firstBad.focus();
        return false;
      }
      errorEl.hidden = true;
      return true;
    }

    /* ---- 9. Envoi Web3Forms ---- */
    function setLoading(on) {
      if (on) {
        submitBtn.classList.add('is-loading');
        submitBtn.setAttribute('aria-busy', 'true');
        var arrow = submitBtn.querySelector('.q-btn-arrow');
        if (arrow) arrow.innerHTML = '<span class="q-spinner"></span>';
      } else {
        submitBtn.classList.remove('is-loading');
        submitBtn.removeAttribute('aria-busy');
        var arrow2 = submitBtn.querySelector('.q-btn-arrow');
        if (arrow2) arrow2.innerHTML = ARROW;
      }
    }
    function showSuccess(ids) {
      form.hidden = true;
      var sp = document.getElementById('q-success-poles');
      if (sp && ids.length) {
        sp.textContent = ids.length === 1
          ? POLE_BY_ID[ids[0]].name
          : ids.slice(0, -1).map(function (id) { return POLE_BY_ID[id].name; }).join(', ') + ' et ' + POLE_BY_ID[ids[ids.length - 1]].name;
      }
      var sr = document.getElementById('q-success-recap');
      if (sr) sr.innerHTML = recapHTML();
      successEl.hidden = false;
      reflow(successEl);
      try { successEl.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' }); } catch (e) {}
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (currentStep !== 2) return;
      if (!validate()) return;

      var ids = selectedPoleIds();
      var name = document.getElementById('f-name').value.trim();
      var company = document.getElementById('f-company').value.trim();
      var accessKey = document.getElementById('f-access-key').value;

      document.getElementById('f-subject').value = buildSubject(ids, company, name);

      var payload = {
        access_key: accessKey,
        subject: buildSubject(ids, company, name),
        from_name: 'Site JCD Groupe',
        botcheck: document.getElementById('f-botcheck').checked,
        intent: currentIntent === 'assistance' ? 'Assistance' : 'Nouveau projet',
        poles: ids.map(function (id) { return POLE_BY_ID[id].name; }).join(', '),
        name: name,
        company: company,
        email: document.getElementById('f-email').value.trim(),
        phone: document.getElementById('f-phone').value.trim(),
        message: document.getElementById('f-message').value.trim(),
        origine: document.referrer || window.location.href,
        details: buildDetails(ids)
      };

      if (!accessKey || accessKey.indexOf('VOTRE_CLE') === 0) {
        errorEl.textContent = 'Le formulaire n’est pas encore relié à Web3Forms (clé d’accès manquante). En attendant, appelez le 03 87 18 49 20 ou écrivez à contact@jcd-groupe.fr.';
        errorEl.hidden = false;
        return;
      }

      setLoading(true);
      errorEl.hidden = true;

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (json) {
          setLoading(false);
          if (json && json.success) {
            showSuccess(ids);
          } else {
            errorEl.textContent = (json && json.message) ? json.message : 'L’envoi a échoué. Réessayez ou appelez le 03 87 18 49 20.';
            errorEl.hidden = false;
          }
        })
        .catch(function () {
          setLoading(false);
          errorEl.textContent = 'Connexion impossible. Réessayez ou appelez le 03 87 18 49 20.';
          errorEl.hidden = false;
        });
    });

    /* ---- 10. Câblage des contrôles de navigation ---- */
    grid.addEventListener('change', updateCount);
    toStep2.addEventListener('click', function () {
      renderRecap();
      showStep(2);
    });
    form.querySelectorAll('[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showStep(parseInt(btn.getAttribute('data-back'), 10));
      });
    });

    /* ---- Init ---- */
    renderPoleCards();
    applyURLParams();
    setIntent(currentIntent === 'assistance' ? 'assistance' : currentIntent);
    requestAnimationFrame(moveGlider);
  })();
