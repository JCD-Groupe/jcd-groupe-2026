(function () {
  'use strict';

  /* ---- Carrousel de principes ---- */
  var stage = document.querySelector('[data-values]');
  if (stage) {
    var track = stage.querySelector('.values-track');
    var slides = track ? track.children : [];
    var prev = stage.querySelector('[data-values-prev]');
    var next = stage.querySelector('[data-values-next]');
    var curEl = document.getElementById('values-cur');
    var n = slides.length, idx = 0;
    var pad = function (x) { return (x < 10 ? '0' : '') + x; };
    var update = function () {
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      for (var i = 0; i < n; i++) slides[i].classList.toggle('is-active', i === idx);
      if (curEl) curEl.textContent = pad(idx + 1);
      if (prev) prev.disabled = (idx === 0);
      if (next) next.disabled = (idx === n - 1);
    };
    if (prev) prev.addEventListener('click', function () { if (idx > 0) { idx--; update(); } });
    if (next) next.addEventListener('click', function () { if (idx < n - 1) { idx++; update(); } });
    if (n) update();
  }

  /* ---- Accordéons (avantages · recrutement · FAQ) ---- */
  var questions = document.querySelectorAll('.acc-q');
  Array.prototype.forEach.call(questions, function (q) {
    var item = q.closest('.acc-item');
    var panel = item ? item.querySelector('.acc-a') : null;
    if (!panel) return;
    q.addEventListener('click', function () {
      var isOpen = q.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        panel.style.height = panel.scrollHeight + 'px';
        void panel.offsetHeight;
        panel.style.height = '0px';
        q.setAttribute('aria-expanded', 'false');
      } else {
        q.setAttribute('aria-expanded', 'true');
        panel.style.height = panel.scrollHeight + 'px';
        var done = function () {
          if (q.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
          panel.removeEventListener('transitionend', done);
        };
        panel.addEventListener('transitionend', done);
      }
    });
  });
})();
