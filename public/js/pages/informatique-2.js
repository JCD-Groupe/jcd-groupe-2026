/* Fan-wires cybersecurite : les extremites rejoignent le centre reel des
   3 cards a toute largeur (le gap px de la grille rend tout point fixe du
   viewBox inexact). pathLength=1000 -> l'animation de trace est preservee. */
(function () {
  var svg = document.querySelector('.cyber-branches');
  var grid = document.querySelector('.cyber-piliers');
  if (!svg || !grid) return;
  var wires = svg.querySelectorAll('.cyber-wire');
  function redraw() {
    if (wires.length < 3 || grid.children.length < 3) return;
    if (getComputedStyle(svg).display === 'none') return;
    var sb = svg.getBoundingClientRect();
    if (!sb.width) return;
    for (var i = 0; i < 3; i++) {
      var cb = grid.children[i].getBoundingClientRect();
      var cx = ((cb.left + cb.width / 2 - sb.left) / sb.width * 1000).toFixed(1);
      var d = (i === 1)
        ? 'M500 2 L' + cx + ' 120'
        : 'M500 2 C500 62 ' + cx + ' 58 ' + cx + ' 120';
      wires[i].setAttribute('d', d);
    }
  }
  redraw();
  window.addEventListener('load', redraw);
  var t = 0;
  function queue() { clearTimeout(t); t = setTimeout(redraw, 120); }
  window.addEventListener('resize', queue);
  if ('ResizeObserver' in window) new ResizeObserver(queue).observe(grid);
})();
