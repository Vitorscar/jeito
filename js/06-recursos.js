window.JEITO = window.JEITO || {};
(function (J) {
  'use strict';

  var cards = document.querySelectorAll('#recursos .rec-card[data-tilt]');
  if (!cards.length) return;

  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Tilt 3D + brilho seguindo o cursor */
  if (canHover && !reduce) {
    cards.forEach(function (card) {
      var raf = 0, lastX = 0, lastY = 0;
      card.addEventListener('mousemove', function (e) {
        lastX = e.clientX; lastY = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = card.getBoundingClientRect();
          var x = ((lastX - r.left) / r.width) * 100;
          var y = ((lastY - r.top)  / r.height) * 100;
          var ry = ((x - 50) / 50) * 3;
          var rx = ((y - 50) / 50) * -3;
          card.style.setProperty('--mx', x.toFixed(1) + '%');
          card.style.setProperty('--my', y.toFixed(1) + '%');
          card.style.setProperty('--rx', rx.toFixed(2) + 'deg');
          card.style.setProperty('--ry', ry.toFixed(2) + 'deg');
        });
      });
      card.addEventListener('mouseleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
      });
    });
  }

  /* Swatches de identidade visual */
  var swatches = document.querySelectorAll('#recursos .swatch');
  var preview  = document.getElementById('rec-color-preview');
  swatches.forEach(function (sw) {
    sw.addEventListener('click', function () {
      swatches.forEach(function (s) { s.classList.remove('on'); });
      sw.classList.add('on');
      if (preview) {
        var c = getComputedStyle(sw).getPropertyValue('--c').trim();
        if (c) preview.style.background = c;
      }
    });
  });

  /* Calendário: datas selecionáveis */
  var calGrid = document.getElementById('rec-cal-grid');
  if (calGrid) {
    calGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn || btn.classList.contains('off')) return;
      calGrid.querySelectorAll('button.on').forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
    });
  }

  /* WhatsApp com microanimação */
  var waBtn = document.querySelector('#recursos .wa-btn');
  if (waBtn && !reduce) {
    waBtn.addEventListener('click', function () {
      waBtn.classList.remove('pulse');
      void waBtn.offsetWidth;
      waBtn.classList.add('pulse');
    });
  }
})(window.JEITO);