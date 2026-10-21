window.JEITO = window.JEITO || {};
(function (J) {
  'use strict';

  /* ---- Estado mutável global ---- */
  J.state = {
    KEY: 'jeito-studio-v2',
    uid: 0,
    S: null,            // página do Studio
    H: [],              // histórico de undo
    sel: null,          // índice do elemento selecionado
    drag: null,         // índice do elemento sendo arrastado
    tab: 'el',          // aba ativa no painel de ferramentas
    SP: null,           // estado do cadastro
    started: false,     // Studio já foi inicializado?
    lastView: null,     // última view para não re-scrollar
    studioBound: false, // handlers do Studio já foram ligados?
    ioAnim: null        // IntersectionObserver ativo
  };

  /* ---- Paletas ---- */
  J.BG = {
    creme:  { n: 'Papel',      bg: '#FBF8F3', fg: '#14302A', acc: '#1F5C4D', on: '#FFFFFF', card: '#FFFFFF' },
    carvao: { n: 'Floresta',   bg: '#14302A', fg: '#FBF8F3', acc: '#FFD98A', on: '#14302A', card: '#1F443B' },
    lima:   { n: 'Manteiga',   bg: '#FFE9B8', fg: '#14302A', acc: '#EE6A43', on: '#FFFFFF', card: '#FFF6DF' },
    oliva:  { n: 'Menta',      bg: '#DCEBDD', fg: '#14302A', acc: '#1F5C4D', on: '#FFFFFF', card: '#F1F8F1' },
    vidro:  { n: 'Pôr do sol', bg: 'linear-gradient(135deg,#FFE9B8,#F8B79C)', fg: '#14302A', acc: '#14302A', on: '#FFFFFF', card: 'rgba(255,255,255,.6)' }
  };

  J.FONTS = { limpa: 'Limpa', elegante: 'Elegante', moderna: 'Moderna' };

  /* ---- Modelos de página ---- */
  J.T = {
    branco: { n: 'Em branco', bg: 'creme', font: 'limpa', al: 'center', els: [
      ['selo', 'Sua marca'], ['titulo', 'Seu negócio.'], ['texto', 'Apresente seus serviços ao mundo.'],
      ['botao', 'Fale conosco'], ['contato', 'WhatsApp', '(00) 00000-0000'], ['selo', 'Mais vendido'], ['icone', '✦']
    ]},
    barbearia: { n: 'Barbearia', bg: 'carvao', font: 'moderna', al: 'center', els: [
      ['selo', 'Aberto de terça a sábado'], ['titulo', 'Barbearia Dom Bigode'], ['texto', 'Corte na régua, hora marcada.'],
      ['botao', 'Agendar horário'], ['separador'], ['cartao', 'Corte', '30 min · R$ 50'], ['cartao', 'Barba', '30 min · R$ 40'],
      ['contato', 'WhatsApp', '(00) 00000-0000']
    ]},
    salao: { n: 'Salão de beleza', bg: 'creme', font: 'elegante', al: 'center', els: [
      ['icone', '✦'], ['titulo', 'Ateliê Aurora'], ['texto', 'Cuidado e elegância para o seu dia.'],
      ['botao', 'Reservar horário'], ['cartao', 'Manicure', '1 h · R$ 45'], ['cartao', 'Escova', '45 min · R$ 60'],
      ['contato', 'WhatsApp', '(00) 00000-0000']
    ]},
    auto: { n: 'Serviço automotivo', bg: 'oliva', font: 'limpa', al: 'left', els: [
      ['selo', 'Atendimento com hora marcada'], ['titulo', 'Garagem 7'], ['texto', 'Estética automotiva com padrão técnico.'],
      ['botao', 'Solicitar horário'], ['separador'], ['cartao', 'Lavagem detalhada', '2 h · R$ 120'], ['cartao', 'Polimento', '4 h · R$ 380']
    ]}
  };

  /* ---- Efeitos ---- */
  J.FX_DEF = { anim: 'none', speed: 'med', shadow: 'soft', radius: 'soft' };
  J.FXLBL = {
    anim:   { none: 'Nenhuma', fade: 'Suave', up: 'Subir', zoom: 'Zoom' },
    speed:  { fast: 'Rápida', med: 'Média', slow: 'Lenta' },
    shadow: { none: 'Sem', soft: 'Suave', hard: 'Marcante' },
    radius: { sq: 'Quadrado', soft: 'Suave', round: 'Redondo' }
  };
  J.PAGE_DEF = { grad: false, dir: '135deg', int: 38, reveal: true, zoom: true };

  /* ---- Fábrica de elementos ---- */
  J.mk = function (x) {
    return { id: ++J.state.uid, type: x[0], text: x[1] || '', sub: x[2] || '', img: '', fx: J.cp(J.FX_DEF) };
  };

  J.fromT = function (k) {
    var t = J.T[k] || J.T.branco;
    return { bg: t.bg, font: t.font, al: t.al, els: t.els.map(J.mk), page: J.cp(J.PAGE_DEF) };
  };

  J.normalize = function (o) {
    if (!o || !o.els || !J.BG[o.bg] || !J.FONTS[o.font]) return null;
    if (!o.page) o.page = J.cp(J.PAGE_DEF);
    Object.keys(J.PAGE_DEF).forEach(function (k) { if (!(k in o.page)) o.page[k] = J.PAGE_DEF[k]; });
    o.els.forEach(function (e) {
      e.id = ++J.state.uid;
      if (!e.fx) e.fx = {};
      Object.keys(J.FX_DEF).forEach(function (k) { if (!(k in e.fx)) e.fx[k] = J.FX_DEF[k]; });
      if (!J.FXLBL.anim[e.fx.anim]) e.fx.anim = 'none';
      if (!J.FXLBL.speed[e.fx.speed]) e.fx.speed = 'med';
      if (!J.FXLBL.shadow[e.fx.shadow]) e.fx.shadow = 'soft';
      if (!J.FXLBL.radius[e.fx.radius]) e.fx.radius = 'soft';
      if (e.img && e.img.indexOf('data:image/') !== 0) e.img = '';
    });
    return o;
  };

  J.load = function () {
    try { return J.normalize(JSON.parse(localStorage.getItem(J.state.KEY))); }
    catch (e) { return null; }
  };

  J.save = function () {
    try { localStorage.setItem(J.state.KEY, JSON.stringify(J.state.S)); }
    catch (e) { /* ignore */ }
  };
})(window.JEITO);