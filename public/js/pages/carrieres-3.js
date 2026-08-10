  /* Voile givré : cale body::after sur le rect du panneau de menu ouvert
     (le blur ne peut pas vivre dans la navbar fixed — bug Chromium). */
  (function setupMenuFrost() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('.nav-panel'));
    if (!panels.length || !window.MutationObserver) return;
    var current = null;
    function place(panel) {
      var r = panel.getBoundingClientRect();
      var s = document.body.style;
      s.setProperty('--menu-x', r.left + 'px');
      s.setProperty('--menu-y', r.top + 'px');
      s.setProperty('--menu-w', r.width + 'px');
      s.setProperty('--menu-h', r.height + 'px');
    }
    var ro = window.ResizeObserver ? new ResizeObserver(function () { if (current) place(current); }) : null;
    var mo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        var p = m.target;
        if (p.getAttribute('aria-hidden') === 'false') {
          current = p; place(p);
          if (ro) { ro.disconnect(); ro.observe(p); var sh = p.querySelector('.nav-panel__shell'); if (sh) ro.observe(sh); }
        } else if (current === p) {
          current = null;
          if (ro) ro.disconnect();
        }
      });
    });
    panels.forEach(function (p) { mo.observe(p, { attributes: true, attributeFilter: ['aria-hidden'] }); });
    window.addEventListener('resize', function () { if (current) place(current); });
  })();
