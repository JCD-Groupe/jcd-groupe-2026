  /* ====================================================================
     CARRIÈRES — moteur de la page.
     · OFFRES : source de données unique des offres d'emploi. Pour
       ajouter / retirer / modifier une offre, n'éditer que ce tableau.
     · Rendu de la liste des offres + compteur du hero.
     · Bascule "Répondre à une offre" / "Candidature spontanée".
     · Pré-sélection via clic sur une offre ou via l'URL
       (?offre=<id> ou ?type=spontanee).
     · Dépôt de CV en drag & drop (PDF/DOC/DOCX, 5 Mo max).
     · Validation côté client + envoi multipart vers Web3Forms.
     ==================================================================== */
  (function setupCarrieres() {
    var form = document.getElementById("apply-form");
    if (!form) return;

    /* ---- Source de données des offres ----
       Le bloc JSON #jcd-offres-data (carrieres.astro) est la source
       unique — c'est lui qui sera rempli depuis Directus. Champs :
       id, titre, pole, poleName, lieu, contrat, temps, desc. ---- */
    var OFFRES = [];
    try {
      OFFRES = JSON.parse(
        document.getElementById("jcd-offres-data").textContent,
      );
    } catch (e) {
      console.error(
        "[carrieres] Données offres introuvables ou invalides (#jcd-offres-data)",
        e,
      );
    }
    /* Couleurs par pôle — mêmes tokens que le méga-menu. */
    var POLE_COLORS = {
      informatique: "#2E72BA",
      service: "#E51D29",
      developpement: "#F9D605",
      print: "#F3941D",
      telecom: "#B063AC",
      formation: "#8EC041",
      agencement: "#A78D75",
    };
    /* ------------------------------------------------------------------ */

    var OFFRE_BY_ID = {};
    OFFRES.forEach(function (o) {
      OFFRE_BY_ID[o.id] = o;
    });

    var ARROW =
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
    var MAX_CV_BYTES = 5 * 1024 * 1024;
    var CV_EXTENSIONS = ["pdf", "doc", "docx"];

    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c];
      });
    }

    /* ---- Références DOM ---- */
    var listEl = document.getElementById("offers-list");
    var heroCount = document.getElementById("offres-count");
    var leadEl = document.getElementById("apply-lead");
    var fieldOffre = document.getElementById("field-offre");
    var fieldPoste = document.getElementById("field-poste");
    var selOffre = document.getElementById("f-offre");
    var inpPoste = document.getElementById("f-poste");
    var errorEl = document.getElementById("q-error");
    var submitBtn = document.getElementById("q-submit");
    var successEl = document.getElementById("q-success");
    var intentOpts = form.querySelectorAll(".q-intent-opt");
    var glider = form.querySelector(".q-intent-glider");

    var drop = document.getElementById("cv-drop");
    var fileInput = document.getElementById("f-cv");
    var fileNameEl = document.getElementById("cv-file-name");
    var fileSizeEl = document.getElementById("cv-file-size");
    var fileRemove = document.getElementById("cv-file-remove");
    var cvStatus = document.getElementById("cv-status");

    var prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    var currentIntent = "offre";

    /* ---- 1. Rendu des offres (cartes du carrousel) + compteur ---- */
    function renderOffers() {
      if (!listEl) return;
      if (OFFRES.length === 0) {
        listEl.innerHTML =
          '<div class="offers-empty" role="listitem">Aucune offre ouverte pour le moment, ' +
          "les candidatures spontanées restent les bienvenues.</div>";
        return;
      }
      // listEl.innerHTML = OFFRES.map(function (o) {
      //   return (
      //     '<article class="offer-card" role="listitem"' +
      //     ' style="--pc: ' +
      //     (POLE_COLORS[o.pole] || "var(--accent)") +
      //     '">' +
      //     '<span class="offer-pole">' +
      //     esc(o.poleName) +
      //     "</span>" +
      //     '<h3 class="offer-title">' +
      //     esc(o.titre) +
      //     "</h3>" +
      //     '<span class="offer-meta">' +
      //     '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' +
      //     esc(o.lieu) +
      //     "</span>" +
      //     '<span class="meta-sep" aria-hidden="true"></span>' +
      //     "<span>" +
      //     esc(o.contrat) +
      //     "</span>" +
      //     '<span class="meta-sep" aria-hidden="true"></span>' +
      //     "<span>" +
      //     esc(o.temps) +
      //     "</span>" +
      //     "</span>" +
      //     '<button type="button" class="offer-toggle" aria-expanded="false">Le poste en détail' +
      //     '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4l2.5 2.5L7.5 4"/></svg>' +
      //     "</button>" +
      //     '<div class="offer-desc"><div><p>' +
      //     esc(o.desc || "") +
      //     "</p></div></div>" +
      //     '<div class="offer-foot">' +
      //     '<a class="offer-apply" href="#postuler" data-offre="' +
      //     esc(o.id) +
      //     '"' +
      //     ' aria-label="Postuler — ' +
      //     esc(o.titre) +
      //     ", " +
      //     esc(o.lieu) +
      //     ", " +
      //     esc(o.contrat) +
      //     '">Postuler' +
      //     '<span class="offer-apply-arrow" aria-hidden="true">' +
      //     ARROW +
      //     "</span>" +
      //     "</a>" +
      //     "</div>" +
      //     "</article>"
      //   );
      // }).join("");

      /* Clic "Postuler" : pré-sélectionne l'offre dans le formulaire. */
      listEl.querySelectorAll(".offer-apply").forEach(function (link) {
        link.addEventListener("click", function () {
          selectOffer(link.getAttribute("data-offre"));
        });
      });

      /* Dépliage de la description. */
      listEl.querySelectorAll(".offer-toggle").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var card = btn.closest(".offer-card");
          var open = card.classList.toggle("is-open");
          btn.setAttribute("aria-expanded", open ? "true" : "false");
        });
      });
    }

    /* ---- 1bis. Flèches du carrousel : défilement carte par carte ---- */
    function setupOffersCarousel() {
      var prev = document.getElementById("offers-prev");
      var next = document.getElementById("offers-next");
      if (!listEl || !prev || !next) return;
      function step() {
        var card = listEl.querySelector(".offer-card");
        return card ? card.offsetWidth + 14 : 320;
      }
      function updateArrows() {
        var max = listEl.scrollWidth - listEl.clientWidth - 2;
        prev.disabled = listEl.scrollLeft <= 2;
        next.disabled = listEl.scrollLeft >= max;
      }
      prev.addEventListener("click", function () {
        listEl.scrollBy({
          left: -step(),
          behavior: prefersReduced ? "auto" : "smooth",
        });
      });
      next.addEventListener("click", function () {
        listEl.scrollBy({
          left: step(),
          behavior: prefersReduced ? "auto" : "smooth",
        });
      });
      listEl.addEventListener("scroll", updateArrows, { passive: true });
      window.addEventListener("resize", updateArrows);
      updateArrows();
    }

    function renderHeroCount() {
      if (!heroCount) return;
      var n = OFFRES.length;
      heroCount.textContent =
        n === 0
          ? "Candidatures spontanées bienvenues"
          : n +
            (n === 1 ? " poste ouvert" : " postes ouverts") +
            " à Metz & Nancy";
    }

    // function renderSelect() {
    // if (!selOffre) return;
    // var opts = '<option value="" disabled selected>Choisissez une offre…</option>';
    // opts += OFFRES.map(function (o) {
    //   return '<option value="' + esc(o.id) + '">' + esc(o.titre) + ', ' + esc(o.lieu) + ' (' + esc(o.contrat) + ')</option>';
    // }).join('');
    // opts += '<option value="__autre__">Autre / offre non listée</option>';
    // selOffre.innerHTML = opts;
    // }

    /* ---- 2. Bascule offre / spontanée ---- */
    function moveGlider() {
      var active = form.querySelector(".q-intent-opt.is-selected");
      if (!active || !glider) return;
      glider.style.width = active.offsetWidth + "px";
      glider.style.transform = "translateX(" + (active.offsetLeft - 4) + "px)";
    }
    function setIntent(intent) {
      currentIntent = intent;
      intentOpts.forEach(function (o) {
        var on = o.getAttribute("data-intent") === intent;
        o.classList.toggle("is-selected", on);
        o.setAttribute("aria-checked", on ? "true" : "false");
      });
      var spont = intent === "spontanee";
      fieldOffre.hidden = spont;
      fieldPoste.hidden = !spont;
      selOffre.required = !spont;
      inpPoste.required = spont;
      if (leadEl) {
        leadEl.innerHTML = spont
          ? "Pas d’offre correspondante&nbsp;? Dites-nous <strong>le poste que vous recherchez</strong>, on saura à qui transmettre."
          : "Sélectionnez l’offre qui vous intéresse, joignez votre CV, c’est tout.";
      }
      moveGlider();
    }
    intentOpts.forEach(function (o) {
      o.addEventListener("click", function () {
        setIntent(o.getAttribute("data-intent"));
      });
    });
    window.addEventListener("resize", moveGlider);

    /* ---- 3. Pré-sélection : clic sur une offre / liens / URL ---- */
    function selectOffer(id) {
      // if (!OFFRE_BY_ID[id]) return;
      setIntent("offre");
      selOffre.value = id;
      setFieldError("f-offre", false);
    }
    document
      .querySelectorAll('[data-intent-link="spontanee"]')
      .forEach(function (a) {
        a.addEventListener("click", function () {
          setIntent("spontanee");
        });
      });
    (function applyURLParams() {
      var params = new URLSearchParams(window.location.search);
      var offreParam = params.get("offre");
      var typeParam = params.get("type");
      if (offreParam && OFFRE_BY_ID[offreParam]) {
        selectOffer(offreParam);
      } else if (typeParam === "spontanee") {
        setIntent("spontanee");
      }
    })();

    /* ---- 4. Dépôt de CV (drag & drop) ---- */
    function fmtSize(bytes) {
      if (bytes < 1024) return bytes + " o";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " Ko";
      return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
    }
    function cvError(msg) {
      drop.classList.add("has-error");
      errorEl.textContent = msg;
      errorEl.hidden = false;
      if (cvStatus) cvStatus.textContent = msg;
    }
    function clearCvError() {
      drop.classList.remove("has-error");
    }
    function setFile(file) {
      clearCvError();
      if (!file) return;
      var ext = (file.name.split(".").pop() || "").toLowerCase();
      if (CV_EXTENSIONS.indexOf(ext) === -1) {
        fileInput.value = "";
        cvError(
          "Format non pris en charge : merci de joindre un PDF, DOC ou DOCX.",
        );
        return;
      }
      if (file.size > MAX_CV_BYTES) {
        fileInput.value = "";
        cvError(
          "Fichier trop lourd (" +
            fmtSize(file.size) +
            ") : la limite est de 5 Mo.",
        );
        return;
      }
      errorEl.hidden = true;
      fileNameEl.textContent = file.name;
      fileSizeEl.textContent = fmtSize(file.size) + " · " + ext.toUpperCase();
      drop.classList.add("has-file");
      if (cvStatus) cvStatus.textContent = "Fichier joint : " + file.name;
    }
    function clearFile() {
      fileInput.value = "";
      drop.classList.remove("has-file");
      clearCvError();
      if (cvStatus) cvStatus.textContent = "Aucun fichier joint.";
    }
    fileInput.addEventListener("change", function () {
      setFile(fileInput.files && fileInput.files[0]);
    });
    fileRemove.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      clearFile();
    });
    ["dragenter", "dragover"].forEach(function (evt) {
      drop.addEventListener(evt, function (e) {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.add("is-drag");
      });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      drop.addEventListener(evt, function (e) {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.remove("is-drag");
      });
    });
    drop.addEventListener("drop", function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) {
        try {
          fileInput.files = files;
        } catch (err) {
          /* anciens navigateurs : on garde la sélection manuelle */
        }
        setFile(files[0]);
      }
    });

    /* ---- 5. Validation ---- */
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var PHONE_RE = /^[+0-9 ().\-]{6,20}$/;
    function setFieldError(id, on) {
      var field = document.getElementById(id);
      if (field && field.closest(".q-field"))
        field.closest(".q-field").classList.toggle("has-error", on);
    }
    function validate() {
      var firstname = document.getElementById("f-firstname");
      var lastname = document.getElementById("f-lastname");
      var phone = document.getElementById("f-phone");
      var email = document.getElementById("f-email");
      var consent = document.getElementById("f-consent");
      var problems = [];
      var firstBad = null;

      var fnOk = firstname.value.trim().length > 0;
      var lnOk = lastname.value.trim().length > 0;
      var phOk = PHONE_RE.test(phone.value.trim());
      var emOk = EMAIL_RE.test(email.value.trim());
      setFieldError("f-firstname", !fnOk);
      setFieldError("f-lastname", !lnOk);
      setFieldError("f-phone", !phOk);
      setFieldError("f-email", !emOk);
      if (!fnOk) {
        problems.push("votre prénom");
        firstBad = firstBad || firstname;
      }
      if (!lnOk) {
        problems.push("votre nom");
        firstBad = firstBad || lastname;
      }
      if (!phOk) {
        problems.push("un numéro de téléphone valide");
        firstBad = firstBad || phone;
      }
      if (!emOk) {
        problems.push("un email valide");
        firstBad = firstBad || email;
      }

      if (currentIntent === "offre") {
        var ofOk = !!selOffre.value;
        setFieldError("f-offre", !ofOk);
        if (!ofOk) {
          problems.push("l’offre concernée");
          firstBad = firstBad || selOffre;
        }
      } else {
        var poOk = inpPoste.value.trim().length > 0;
        setFieldError("f-poste", !poOk);
        if (!poOk) {
          problems.push("le poste recherché");
          firstBad = firstBad || inpPoste;
        }
      }

      var cvOk = !!(fileInput.files && fileInput.files.length);
      drop.classList.toggle("has-error", !cvOk);
      if (!cvOk) {
        problems.push("votre CV");
        firstBad = firstBad || fileInput;
      }

      if (!consent.checked) {
        problems.push("votre consentement");
        firstBad = firstBad || consent;
      }

      if (problems.length) {
        errorEl.textContent =
          "Merci de renseigner : " + problems.join(", ") + ".";
        errorEl.hidden = false;
        if (firstBad && firstBad.focus) firstBad.focus();
        return false;
      }
      errorEl.hidden = true;
      return true;
    }

    /* ---- 6. Envoi Web3Forms (multipart : la pièce jointe suit) ---- */
    function postLabel() {
      if (currentIntent === "spontanee") return inpPoste.value.trim();
      if (selOffre.value === "__autre__") return "Autre offre (non listée)";
      var o = OFFRE_BY_ID[selOffre.value];
      return o ? o.titre + ", " + o.lieu : "";
    }
    function buildSubject() {
      var who =
        document.getElementById("f-firstname").value.trim() +
        " " +
        document.getElementById("f-lastname").value.trim();
      return (
        (currentIntent === "spontanee"
          ? "[CANDIDATURE SPONTANÉE] "
          : "[CANDIDATURE OFFRE] ") +
        postLabel() +
        " — " +
        who
      );
    }
    function setLoading(on) {
      if (on) {
        submitBtn.classList.add("is-loading");
        submitBtn.setAttribute("aria-busy", "true");
        var arrow = submitBtn.querySelector(".q-btn-arrow");
        if (arrow) arrow.innerHTML = '<span class="q-spinner"></span>';
      } else {
        submitBtn.classList.remove("is-loading");
        submitBtn.removeAttribute("aria-busy");
        var arrow2 = submitBtn.querySelector(".q-btn-arrow");
        if (arrow2) arrow2.innerHTML = ARROW;
      }
    }
    function showSuccess() {
      form.hidden = true;
      var recap = document.getElementById("q-success-recap");
      if (recap) {
        recap.textContent =
          (currentIntent === "spontanee" ? "Candidature spontanée : " : "") +
          postLabel();
      }
      successEl.hidden = false;
      try {
        successEl.scrollIntoView({
          behavior: prefersReduced ? "auto" : "smooth",
          block: "center",
        });
      } catch (e) {}
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;

      var accessKey = document.getElementById("f-access-key").value;
      if (!accessKey || accessKey.indexOf("VOTRE_CLE") === 0) {
        errorEl.textContent =
          "Le formulaire n’est pas encore relié à Web3Forms (clé d’accès manquante). En attendant, envoyez votre CV à recrutement@jcd-groupe.fr ou appelez le 03 87 18 49 20.";
        errorEl.hidden = false;
        return;
      }

      document.getElementById("f-subject").value = buildSubject();

      var fd = new FormData();
      fd.append("access_key", accessKey);
      fd.append("subject", buildSubject());
      fd.append("from_name", "Site JCD Groupe — Carrières");
      fd.append(
        "botcheck",
        document.getElementById("f-botcheck").checked ? "on" : "",
      );
      fd.append(
        "type_candidature",
        currentIntent === "spontanee"
          ? "Candidature spontanée"
          : "Réponse à une offre",
      );
      fd.append("poste", postLabel());
      fd.append("prenom", document.getElementById("f-firstname").value.trim());
      fd.append("nom", document.getElementById("f-lastname").value.trim());
      fd.append("telephone", document.getElementById("f-phone").value.trim());
      fd.append("email", document.getElementById("f-email").value.trim());
      fd.append("origine", document.referrer || window.location.href);
      if (fileInput.files && fileInput.files[0]) {
        fd.append("attachment", fileInput.files[0], fileInput.files[0].name);
      }

      setLoading(true);
      errorEl.hidden = true;

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: fd,
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (json) {
          setLoading(false);
          if (json && json.success) {
            showSuccess();
          } else {
            errorEl.textContent =
              json && json.message
                ? json.message
                : "L’envoi a échoué. Réessayez ou écrivez à recrutement@jcd-groupe.fr.";
            errorEl.hidden = false;
          }
        })
        .catch(function () {
          setLoading(false);
          errorEl.textContent =
            "Connexion impossible. Réessayez ou écrivez à recrutement@jcd-groupe.fr.";
          errorEl.hidden = false;
        });
    });

    /* ---- Init ---- */
    renderOffers();
    setupOffersCarousel();
    renderHeroCount();
    /* Re-applique les params URL après le remplissage du select
       (l'option doit exister avant d'être sélectionnée). */
    (function reapplyOffre() {
      var params = new URLSearchParams(window.location.search);
      var offreParam = params.get("offre");
      if (offreParam && OFFRE_BY_ID[offreParam]) selOffre.value = offreParam;
    })();
    setIntent(currentIntent);
    requestAnimationFrame(moveGlider);
  })();
