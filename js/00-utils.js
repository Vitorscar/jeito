window.JEITO = window.JEITO || {};
(function (J) {
  'use strict';

  J.$ = function (s, r) { return (r || document).querySelector(s); };
  J.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  J.cp = function (o) { return JSON.parse(JSON.stringify(o)); };

  J.esc = function (t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  J.slugify = function (s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  };

  J.hex2rgb = function (h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };

  J.mix = function (a, b, t) {
    var A = J.hex2rgb(a), B = J.hex2rgb(b);
    return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')';
  };

  J.reduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion:reduce)').matches);
})(window.JEITO);