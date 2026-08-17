/* Aperçu projet : carousel d'images (realisations/<slug>-1..N.jpg) + description
   longue. La page passe en flou gaussien (backdrop-filter). Repli logo si les
   captures ne sont pas encore déposées. */
(function () {
  var modal = document.getElementById("rp-modal");
  if (!modal) return;
  var grid = document.getElementById("real-grid");
  var track = document.getElementById("rp-track");
  var dotsRow = document.getElementById("rp-dots");
  var counter = document.getElementById("rp-counter");
  var carousel = document.getElementById("rp-carousel");
  var dialog = modal.querySelector(".rp-dialog");
  var idx = 0,
    slides = [],
    fb = null,
    lastFocus = null;

  function pad(n) {
    n = String(n);
    return n.length < 2 ? "0" + n : n;
  }

  function visList() {
    var v = slides.filter(function (s) {
      return !s.classList.contains("is-missing");
    });
    if (v.length) {
      if (fb) fb.classList.add("is-missing");
      return v;
    }
    if (fb) fb.classList.remove("is-missing");
    return fb ? [fb] : [];
  }

  function buildDots() {
    dotsRow.innerHTML = "";
    visList().forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "rp-dot" + (i === idx ? " is-active" : "");
      b.setAttribute("aria-label", "Image " + (i + 1));
      b.addEventListener("click", function () {
        go(i);
      });
      dotsRow.appendChild(b);
    });
  }

  function render() {
    var vis = visList();
    carousel.classList.toggle("is-single", vis.length <= 1);
    if (!vis.length) {
      counter.innerHTML = "<b>01</b> / 01";
      return;
    }
    if (idx >= vis.length) idx = vis.length - 1;
    if (idx < 0) idx = 0;
    track.style.transform = "translateX(-" + vis[idx].offsetLeft + "px)";
    counter.innerHTML = "<b>" + pad(idx + 1) + "</b> / " + pad(vis.length);
    Array.prototype.forEach.call(dotsRow.children, function (d, i) {
      d.classList.toggle("is-active", i === idx);
    });
  }

  function go(n) {
    var vis = visList();
    if (!vis.length) return;
    idx = (n + vis.length) % vis.length;
    render();
  }

  function open(card) {
    var slug = card.getAttribute("data-project");
    lastFocus = document.activeElement;

    document.getElementById("rp-title").innerHTML =
      card.querySelector(".real-title").innerHTML;
    document.getElementById("rp-eyebrow").textContent = card
      .querySelector(".real-tag")
      .textContent.trim();
    document.getElementById("rp-bar-title").innerHTML =
      "projet · <em>" + slug + "</em>";
    document.getElementById("rp-sub").textContent =
      card.getAttribute("data-sub");
    document.getElementById("rp-desc").textContent =
      card.getAttribute("data-desc");

    var tech = document.getElementById("rp-tech");
    tech.innerHTML = "";
    var techList = (card.getAttribute("data-tech") || "").split(", ");
    techList.forEach(function (/** @type {string} */ techName) {
      if (!techName) return;
      var x = document.createElement("li");
      x.textContent = techName;
      tech.appendChild(x);
    });

    /* slides captures */
    track.innerHTML = "";
    slides = [];
    var imgIds = (card.getAttribute("data-imgs-ids") || "").split(",");
    var baseUrl = document.body.getAttribute("data-directus-url") || "";

    imgIds.forEach(function (imgId) {
      if (!imgId) return;
      (function (n) {
        var sl = document.createElement("div");
        sl.className = "rp-slide";
        var im = document.createElement("img");
        im.alt = "";
        im.decoding = "async";
        im.src = baseUrl + "/assets/" + n;
        im.addEventListener("error", function () {
          sl.classList.add("is-missing");
          buildDots();
          render();
        });
        sl.appendChild(im);
        track.appendChild(sl);
        slides.push(sl);
      })(imgId);
    });
    /* repli logo (révélé seulement si aucune capture ne charge) */
    fb = document.createElement("div");
    fb.className = "rp-slide rp-slide--logo is-missing";
    var lim = document.createElement("img");
    var coverImg = card.querySelector(".real-cover");
    lim.alt = coverImg ? coverImg.alt : "";
    if (coverImg) lim.src = coverImg.src;
    fb.appendChild(lim);
    track.appendChild(fb);

    idx = 0;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("rp-locked");

    requestAnimationFrame(function () {
      buildDots();
      render();
      dialog.focus();
    });
    return true;
  }

  function close() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("rp-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (grid) {
    grid.addEventListener("click", function (e) {
      var link = e.target.closest(".real-card-link");
      if (!link) return;
      var card = link.closest(".real-card");
      if (card) {
        e.preventDefault();
        open(card);
      }
    });
  }

  document.getElementById("rp-prev").addEventListener("click", function () {
    go(idx - 1);
  });
  document.getElementById("rp-next").addEventListener("click", function () {
    go(idx + 1);
  });
  document.getElementById("rp-close").addEventListener("click", close);
  Array.prototype.forEach.call(
    modal.querySelectorAll("[data-rp-close]"),
    function (el) {
      el.addEventListener("click", function (e) {
        if (e.target === el) close();
      });
    },
  );
  document.addEventListener("keydown", function (e) {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") go(idx - 1);
    else if (e.key === "ArrowRight") go(idx + 1);
  });
  window.addEventListener("resize", function () {
    if (modal.classList.contains("is-open")) render();
  });
})();
