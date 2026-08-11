(function () {
  var d = document, root = d.documentElement, reduce = false;
  try { if (sessionStorage.getItem('jcdFadeIn')) { sessionStorage.removeItem('jcdFadeIn'); root.classList.add('jcd-nav-in'); } } catch (e) {}
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function veil() { return d.getElementById('jcd-pagefade'); }
  function isInfo(p) {
    var f = (p.split("/").pop() || "").toLowerCase();
    return f === "informatique" || /^info-[a-z]+\$/.test(f);
  }
  d.addEventListener('animationend', function (e) { if (e.animationName === 'jcd-pagefade-reveal') root.classList.remove('jcd-nav-in'); });
  d.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#') return;
    var url; try { url = new URL(raw, location.href); } catch (x) { return; }
    if (url.origin !== location.origin || url.href === location.href) return;
    if (url.pathname === location.pathname && url.hash) return;
    var v = veil(); if (!v) return;
    e.preventDefault();
    try { if (isInfo(url.pathname)) sessionStorage.setItem('jcdFadeIn', '1'); } catch (x) {}
    var go = function () { window.location.href = url.href; };
    if (reduce) { v.style.setProperty('opacity', '1', 'important'); go(); return; }
    var done = false, fire = function () { if (!done) { done = true; go(); } };
    v.style.transition = 'opacity 180ms var(--ease-out)';
    v.addEventListener('transitionend', fire, { once: true });
    setTimeout(fire, 240);
    requestAnimationFrame(function () { v.style.setProperty('opacity', '1', 'important'); });
  });
  addEventListener('pageshow', function (e) {
    if (e.persisted) { root.classList.remove('jcd-nav-in'); var v = veil(); if (v) { v.style.transition = 'none'; v.style.setProperty('opacity', '0', 'important'); } }
  });
})();
