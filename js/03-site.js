window.JEITO = window.JEITO || {};
(function (J) {
  'use strict';
  var $ = J.$, $$ = J.$$, esc = J.esc, reduceMotion = J.reduceMotion;

  /* ---- Mockups das seções de exemplo ---- */
  var M = {
    barb: { slug: 'dombigode', n: 'Barbearia Dom Bigode', tag: 'Corte na régua, hora marcada.', cta: 'Agendar horário',
      sv: [['Corte', '30 min', 'R$ 50'], ['Barba', '30 min', 'R$ 40'], ['Corte + barba', '1 h', 'R$ 85']] },
    salao: { slug: 'ateliaurora', n: 'Ateliê Aurora', tag: 'Cuidado e elegância para o seu dia.', cta: 'Reservar horário',
      sv: [['Manicure', '1 h', 'R$ 45'], ['Escova', '45 min', 'R$ 60'], ['Coloração', '2 h', 'R$ 180']] },
    auto: { slug: 'garagem7', n: 'Garagem 7', tag: 'Estética automotiva com padrão técnico.', cta: 'Solicitar horário',
      sv: [['Lavagem detalhada', '2 h', 'R$ 120'], ['Polimento', '4 h', 'R$ 380'], ['Higienização interna', '3 h', 'R$ 220']] },
    padrao: { slug: 'seunegocio', n: 'Seu Negócio', tag: 'Descrição curta da empresa.', cta: 'Entrar em contato',
      sv: [['Serviço A', '1 h', 'R$ 00'], ['Serviço B', '30 min', 'R$ 00'], ['Serviço C', '2 h', 'R$ 00']] }
  };

  function mock(k, phone) {
    var d = M[k] || M.padrao;
    var items = d.sv.map(function (s) {
      return '<li><span>' + s[0] + ' · ' + s[1] + '</span><b>' + s[2] + '</b></li>';
    }).join('');
    return '<figure class="mock' + (phone ? ' phone' : '') + '" data-t="' + k + '"' +
      ' role="img" aria-label="Exemplo de página comercial: ' + d.n + '">' +
      '<div class="bar"><i></i><i></i><i></i><span>jeito.app/' + d.slug + '</span></div>' +
      '<div class="cover"></div><div class="mb"><div class="lg">' + d.n.charAt(0) + '</div>' +
      '<h3>' + d.n + '</h3><p>' + d.tag + '</p><ul>' + items + '</ul><span class="mbtn">' + d.cta + '</span></div>' +
      '<figcaption>Demonstração · valores ilustrativos</figcaption></figure>';
  }
  $$('[data-mock]').forEach(function (el) {
    el.innerHTML = mock(el.getAttribute('data-mock'), el.hasAttribute('data-phone'));
  });

  /* ---- Vitrine vertical (showcase) ---- */
  var SHOW = [
    { n: 'Studio Bella',     t: 'Cabelo · Unhas · Estética', cta: 'Agendar horário',      th: 'th-salao',   lg: 'SB', sv: [['Corte', 'R$ 60'], ['Manicure', 'R$ 45']] },
    { n: 'Barbearia Prime',  t: 'Cortes · Barba · Estilo',   cta: 'Ver serviços',         th: 'th-barb',    lg: 'BP', sv: [['Corte', 'R$ 50'], ['Barba', 'R$ 40']] },
    { n: 'Ateliê das Unhas', t: 'Nail design · Alongamento', cta: 'Reservar atendimento', th: 'th-salao',   lg: 'AU', sv: [['Alongamento', 'R$ 120'], ['Esmaltação', 'R$ 45']] },
    { n: 'Garagem 7',        t: 'Estética automotiva',       cta: 'Solicitar horário',    th: 'th-auto',    lg: 'G7', sv: [['Lavagem', 'R$ 120'], ['Polimento', 'R$ 380']] },
    { n: 'Clínica Vitalis',  t: 'Consultas · Exames',        cta: 'Marcar consulta',      th: 'th-vitalis', lg: 'CV', sv: [['Consulta', 'R$ 250'], ['Retorno', 'R$ 0']] },
    { n: 'Coach Ana',        t: 'Treinos · Acompanhamento',  cta: 'Agendar avaliação',    th: 'th-coach',   lg: 'CA', sv: [['Mensal', 'R$ 300'], ['Avaliação', 'R$ 150']] },
    { n: 'Estúdio Lua',      t: 'Fotografia · Retratos',     cta: 'Ver pacotes',          th: 'th-prime',   lg: 'EL', sv: [['Ensaio', 'R$ 450'], ['Book', 'R$ 900']] },
    { n: 'Nails by Isa',     t: 'Nail design · Spa dos pés', cta: 'Agendar horário',      th: 'th-salao',   lg: 'NI', sv: [['Spa dos pés', 'R$ 80'], ['Gel', 'R$ 90']] }
  ];

  function bcardHTML(o) {
    var sv = (o.sv || []).slice(0, 2).map(function (s) {
      return '<li>' + esc(s[0]) + '<span>' + esc(s[1]) + '</span></li>';
    }).join('');
    return '<article class="bcard ' + (o.th || 'th-prime') + '">' +
      '<div class="bc-cover"></div>' +
      '<div class="bc-body">' +
        '<div class="bc-logo">' + esc(o.lg || '') + '</div>' +
        '<h3>' + esc(o.n) + '</h3>' +
        '<p>' + esc(o.t) + '</p>' +
        '<ul class="bc-list">' + sv + '</ul>' +
        '<span class="bc-btn">' + esc(o.cta) + '</span>' +
      '</div>' +
    '</article>';
  }
  function fillCol(el, list) {
    if (!el) return;
    var html = list.map(bcardHTML).join('');
    el.innerHTML = html + html;
  }
  if (!reduceMotion) {
    fillCol(document.getElementById('col1'), SHOW.slice(0, 4));
    fillCol(document.getElementById('col2'), SHOW.slice(4));
  } else {
    fillCol(document.getElementById('col1'), SHOW.slice(0, 1));
    fillCol(document.getElementById('col2'), SHOW.slice(1, 2));
  }

  /* ---- Header ao rolar ---- */
  var hd = document.getElementById('hd');
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (hd) {
      var on = y > 8;
      hd.classList.toggle('on', on);
      hd.classList.toggle('scrolled', on);
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* ---- Menu mobile ---- */
  var menu = document.getElementById('menu');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    if (!nav || !menu) return;
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  if (menu && nav) {
    menu.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---- Revelação ao rolar ---- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ioRev = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add('in'); ioRev.unobserve(x.target); }
      });
    }, { threshold: 0.14 });
    $$('.rev').forEach(function (el) { ioRev.observe(el); });
  } else {
    $$('.rev').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Botões de plano vão para o cadastro ---- */
  $$('[data-plano]').forEach(function (a) {
    a.addEventListener('click', function () { location.hash = '#criar'; });
  });
})(window.JEITO);