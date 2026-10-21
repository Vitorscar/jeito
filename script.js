(function () {
  'use strict';

  /* ============================================================
     0. UTILITÁRIOS
     ============================================================ */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function cp(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slugify(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  }
  function hex2rgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')';
  }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---- Estado global compartilhado ---- */
  var KEY = 'jeito-studio-v2';
  var uid = 0;
  var S = null;          // estado do Studio
  var started = false;
  var lastView = null;
  var studioBound = false;

  /* ============================================================
     1. ROTEADOR — #site / #criar / #studio
     ============================================================ */
  function currentView() {
    var h = location.hash;
    return h === '#studio' ? 'studio' : h === '#criar' ? 'criar' : 'site';
  }
  function route() {
    var view = currentView();
    var siteEl = document.getElementById('site');
    var criarEl = document.getElementById('criar');
    var studioEl = document.getElementById('studio');
    if (siteEl) siteEl.hidden = view !== 'site';
    if (criarEl) criarEl.hidden = view !== 'criar';
    if (studioEl) studioEl.hidden = view !== 'studio';

    if (view !== lastView) { window.scrollTo(0, 0); lastView = view; }

    var fab = document.querySelector('.fab');
    if (fab) fab.hidden = view !== 'site';

    if (view === 'studio' && !started) { started = true; bootStudio(); }
    if (view === 'criar') initSignup();
  }
  window.addEventListener('hashchange', route);

  /* ============================================================
     2. SITE
     ============================================================ */
  var CONFIG = { endpoint: '', apikey: '' };

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

  $$('[data-plano]').forEach(function (a) {
    a.addEventListener('click', function () { location.hash = '#criar'; });
  });

  /* ============================================================
     3. CADASTRO
     ============================================================ */
  var STEPS = [
    { n: 'Conta',    sub: 'Crie sua conta e dê o primeiro passo para colocar seu negócio online.', btn: 'Criar conta grátis →' },
    { n: 'Negócio',  sub: 'Como seu negócio vai aparecer? Você pode mudar tudo depois.',           btn: 'Continuar →' },
    { n: 'Visual',   sub: 'Escolha o ponto de partida. Você personaliza cada detalhe no editor.',  btn: 'Continuar →' },
    { n: 'Serviços', sub: 'Cadastre o que você oferece, com duração e preço.',                     btn: 'Continuar →' },
    { n: 'Publicar', sub: 'Revise e abra sua página no JEITO Studio.',                             btn: 'Abrir no JEITO Studio →' }
  ];

  var CATS = {
    barbearia: 'Barbearia',
    salao: 'Salão de beleza',
    beleza: 'Beleza e estética',
    auto: 'Serviço automotivo',
    foto: 'Fotografia',
    consultoria: 'Consultoria',
    outro: 'Outro'
  };
  var CAT_TPL = { barbearia: 'barbearia', salao: 'salao', auto: 'auto' };

  var SP = null;
  function spInit() {
    return {
      step: 1,
      conta: { nome: '', email: '', senha: '' },
      negocio: { nome: '', categoria: 'barbearia', whatsapp: '', slug: '' },
      tpl: 'branco',
      servicos: [{ nome: '', dur: '', preco: '' }]
    };
  }

  function renderPreview() {
    var el = document.getElementById('sp-prev');
    if (!el || !SP) return;
    var name = (SP.negocio.nome || 'Seu Negócio').trim() || 'Seu Negócio';
    var cat = CATS[SP.negocio.categoria] || 'Negócio';
    var svcs = SP.servicos.filter(function (s) { return s.nome; });
    var sv = svcs.length
      ? svcs.slice(0, 3).map(function (s) {
          var meta = [s.dur, s.preco].filter(Boolean).join(' · ');
          return '<li>' + esc(s.nome) + '<span>' + esc(meta) + '</span></li>';
        }).join('')
      : '<li>Serviço<span>Duração · R$</span></li><li>Serviço<span>Duração · R$</span></li>';
    var th = { branco: 'th-prime', barbearia: 'th-barb', salao: 'th-salao', auto: 'th-auto' }[SP.tpl] || 'th-prime';
    var lg = name.split(/\s+/).map(function (p) { return p.charAt(0); }).join('').slice(0, 2).toUpperCase() || 'JE';
    var cta = SP.negocio.whatsapp ? 'WhatsApp · ' + SP.negocio.whatsapp : 'Fale conosco';
    el.innerHTML = '<article class="bcard ' + th + '">' +
      '<div class="bc-cover"></div>' +
      '<div class="bc-body">' +
        '<div class="bc-logo">' + esc(lg) + '</div>' +
        '<h3>' + esc(name) + '</h3>' +
        '<p>' + esc(cat) + '</p>' +
        '<ul class="bc-list">' + sv + '</ul>' +
        '<span class="bc-btn">' + esc(cta) + '</span>' +
      '</div>' +
    '</article>';
  }

  function renderTplSelect() {
    $$('#sp-tpls .tpl').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-tpl') === SP.tpl ? 'true' : 'false');
    });
  }

  function renderServices() {
    var list = document.getElementById('sp-svlist');
    if (!list) return;
    if (!SP.servicos.length) SP.servicos.push({ nome: '', dur: '', preco: '' });
    list.innerHTML = SP.servicos.map(function (s, i) {
      return '<div class="sv-row" data-i="' + i + '">' +
        '<input class="sv-n" type="text" placeholder="Nome do serviço" value="' + esc(s.nome) + '">' +
        '<input class="sv-p" type="text" placeholder="Preço" value="' + esc(s.preco) + '">' +
        '<input class="sv-d" type="text" placeholder="Duração" value="' + esc(s.dur) + '">' +
        '<button type="button" class="btn ghost sm sv-rm" data-rm="' + i + '" aria-label="Remover serviço">×</button>' +
      '</div>';
    }).join('');
  }

  function renderReview() {
    var u = document.getElementById('sp-url');
    var s = document.getElementById('sp-sum');
    if (u) u.textContent = 'jeito.app/' + (SP.negocio.slug || slugify(SP.negocio.nome) || 'seunegocio');
    if (s) {
      var svcs = SP.servicos.filter(function (x) { return x.nome; });
      s.innerHTML = '<b>' + esc(SP.negocio.nome || 'Seu Negócio') + '</b> · ' +
        esc(CATS[SP.negocio.categoria] || 'Negócio') + '<br>' +
        svcs.length + ' serviço' + (svcs.length === 1 ? '' : 's') + ' cadastrado' +
        (svcs.length === 1 ? '' : 's');
    }
  }

  function spGo(n) {
    if (!SP) return;
    SP.step = Math.max(1, Math.min(5, n));
    $$('#sp-form .sp-step').forEach(function (s) {
      s.hidden = +s.dataset.step !== SP.step;
    });
    $$('#steps-bar li').forEach(function (li) {
      var sn = +li.dataset.step;
      li.classList.toggle('on', sn === SP.step);
      li.classList.toggle('done', sn < SP.step);
    });
    var st = STEPS[SP.step - 1];
    var title = document.getElementById('sp-title');
    var sub = document.getElementById('sp-sub');
    var next = document.getElementById('sp-next');
    var back = document.getElementById('sp-back');
    if (title) title.textContent = SP.step === 1 ? 'Comece do seu jeito.' : st.n;
    if (sub) sub.textContent = st.sub;
    if (next) next.textContent = st.btn;
    if (back) back.hidden = SP.step === 1;

    if (SP.step === 3) renderTplSelect();
    if (SP.step === 4) renderServices();
    if (SP.step === 5) renderReview();
    renderPreview();
    var status = document.getElementById('sp-status');
    if (status) { status.textContent = ''; status.className = 'sp-status'; }
  }

  function spValidate() {
    var status = document.getElementById('sp-status');
    function err(m) {
      if (status) { status.textContent = m; status.className = 'sp-status err'; }
      return false;
    }
    if (status) { status.textContent = ''; status.className = 'sp-status'; }

    if (SP.step === 1) {
      var nome = (document.getElementById('sp-nome') || {}).value || '';
      var email = (document.getElementById('sp-email') || {}).value || '';
      var senha = (document.getElementById('sp-senha') || {}).value || '';
      nome = nome.trim(); email = email.trim();
      if (nome.length < 2) return err('Informe seu nome.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('Informe um e-mail válido.');
      if (senha.length < 6) return err('A senha precisa ter pelo menos 6 caracteres.');
      SP.conta = { nome: nome, email: email, senha: senha };
    }
    if (SP.step === 2) {
      var negEl = document.getElementById('sp-negocio');
      var catEl = document.getElementById('sp-categoria');
      var wppEl = document.getElementById('sp-whats');
      var slugEl = document.getElementById('sp-slug');
      var neg = (negEl ? negEl.value : '').trim();
      var cat = catEl ? catEl.value : 'barbearia';
      var wpp = (wppEl ? wppEl.value : '').trim();
      var slug = (slugEl ? slugEl.value : '').trim();
      if (neg.length < 2) return err('Informe o nome do negócio.');
      if (!slug) { slug = slugify(neg); if (slugEl) slugEl.value = slug; }
      SP.negocio = { nome: neg, categoria: cat, whatsapp: wpp, slug: slugify(slug) };
    }
    return true;
  }

  function spFinish() {
    if (!SP) return;
    var tplKey = (SP.negocio.categoria && CAT_TPL[SP.negocio.categoria])
      ? CAT_TPL[SP.negocio.categoria]
      : (SP.tpl === 'branco' ? 'branco' : SP.tpl);
    var base = fromT(tplKey);

    var nome = SP.negocio.nome || 'Seu Negócio';
    var cat = CATS[SP.negocio.categoria] || 'Novo';
    var svcs = SP.servicos.filter(function (s) { return s.nome; });

    var els = [];
    els.push({ id: 0, type: 'selo', text: cat, sub: '', img: '', fx: cp(FX_DEF) });
    els.push({ id: 0, type: 'titulo', text: nome, sub: '', img: '', fx: cp(FX_DEF) });
    els.push({ id: 0, type: 'texto', text: 'Bem-vindo(a). Conheça nossos serviços e fale com a gente.', sub: '', img: '', fx: cp(FX_DEF) });
    els.push({ id: 0, type: 'botao', text: 'Falar no WhatsApp', sub: '', img: '', fx: cp(FX_DEF) });
    if (svcs.length) els.push({ id: 0, type: 'separador', text: '', sub: '', img: '', fx: cp(FX_DEF) });
    svcs.forEach(function (s) {
      var meta = [s.dur, s.preco].filter(Boolean).join(' · ');
      els.push({ id: 0, type: 'cartao', text: s.nome, sub: meta, img: '', fx: cp(FX_DEF) });
    });
    if (SP.negocio.whatsapp) {
      els.push({ id: 0, type: 'contato', text: 'WhatsApp', sub: SP.negocio.whatsapp, img: '', fx: cp(FX_DEF) });
    }
    els.forEach(function (e) { e.id = ++uid; });

    S = { bg: base.bg, font: base.font, al: base.al, els: els, page: cp(PAGE_DEF) };
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }

    H.length = 0;
    sel = null;
    SP = null;
    started = false;         // força bootStudio ao navegar
    location.hash = '#studio';
  }

  function bindSignupHandlers(form) {
    var spLogin = document.getElementById('sp-login');
    if (spLogin) spLogin.addEventListener('click', function () {
      var status = document.getElementById('sp-status');
      if (status) { status.textContent = 'Login é uma demonstração. Use "Criar conta grátis".'; status.className = 'sp-status ok'; }
    });

    var g = document.getElementById('sp-google');
    if (g) g.addEventListener('click', function () {
      var status = document.getElementById('sp-status');
      if (status) { status.textContent = 'Login com Google é uma demonstração. Preencha os campos.'; status.className = 'sp-status ok'; }
    });

    $$('#sp-tpls .tpl').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!SP) return;
        SP.tpl = b.getAttribute('data-tpl');
        renderTplSelect();
        renderPreview();
      });
    });

    var addsv = document.getElementById('sp-addsv');
    if (addsv) addsv.addEventListener('click', function () {
      if (!SP) return;
      SP.servicos.push({ nome: '', dur: '', preco: '' });
      renderServices();
    });

    var svlist = document.getElementById('sp-svlist');
    if (svlist) {
      svlist.addEventListener('input', function (ev) {
        if (!SP) return;
        var row = ev.target.closest('.sv-row');
        if (!row) return;
        var i = +row.dataset.i, s = SP.servicos[i];
        if (!s) return;
        if (ev.target.classList.contains('sv-n')) s.nome = ev.target.value;
        if (ev.target.classList.contains('sv-p')) s.preco = ev.target.value;
        if (ev.target.classList.contains('sv-d')) s.dur = ev.target.value;
        renderPreview();
      });
      svlist.addEventListener('click', function (ev) {
        if (!SP) return;
        var btn = ev.target.closest('[data-rm]');
        if (!btn) return;
        var i = +btn.getAttribute('data-rm');
        SP.servicos.splice(i, 1);
        if (!SP.servicos.length) SP.servicos.push({ nome: '', dur: '', preco: '' });
        renderServices();
        renderPreview();
      });
    }

    var negInput = document.getElementById('sp-negocio');
    var slugInput = document.getElementById('sp-slug');
    if (negInput && slugInput) {
      var slugTouched = false;
      slugInput.addEventListener('input', function () { slugTouched = slugInput.value.length > 0; });
      negInput.addEventListener('input', function () {
        if (!slugTouched) slugInput.value = slugify(negInput.value);
      });
    }

    var back = document.getElementById('sp-back');
    if (back) back.addEventListener('click', function () { if (SP && SP.step > 1) spGo(SP.step - 1); });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!SP) return;
      if (SP.step === 5) { spFinish(); return; }
      if (!spValidate()) return;
      spGo(SP.step + 1);
    });
  }

  function initSignup() {
    var fresh = !SP;
    if (!SP) SP = spInit();
    var form = document.getElementById('sp-form');
    if (!form) return;
    if (form.dataset.bound !== '1') {
      form.dataset.bound = '1';
      bindSignupHandlers(form);
    }
    spGo(fresh ? 1 : SP.step);
  }

  /* ============================================================
     4. JEITO STUDIO
     ============================================================ */
  var BG = {
    creme:  { n: 'Creme',  bg: '#F4F0E8', fg: '#20251F', acc: '#20251F', on: '#F4F0E8', card: '#FFFFFF' },
    carvao: { n: 'Carvão', bg: '#20251F', fg: '#F4F0E8', acc: '#D8FF00', on: '#20251F', card: '#2B3129' },
    lima:   { n: 'Lima',   bg: '#D8FF00', fg: '#20251F', acc: '#20251F', on: '#D8FF00', card: '#EAFF70' },
    oliva:  { n: 'Oliva',  bg: '#A7D94A', fg: '#20251F', acc: '#20251F', on: '#A7D94A', card: '#C4E87E' },
    vidro:  { n: 'Vidro',  bg: 'linear-gradient(135deg,#20251F,#3E5428)', fg: '#F4F0E8', acc: '#D8FF00', on: '#20251F', card: 'rgba(244,240,232,.12)' }
  };
  var FONTS = { limpa: 'Limpa', elegante: 'Elegante', moderna: 'Moderna' };
  var LBL = { titulo: 'Título', texto: 'Texto', botao: 'Botão', imagem: 'Imagem', icone: 'Ícone', separador: 'Separador', cartao: 'Cartão', selo: 'Selo', contato: 'Contato' };
  var DEF = {
    titulo: ['Novo título'],
    texto: ['Escreva aqui o seu texto.'],
    botao: ['Fale conosco'],
    imagem: ['Imagem'],
    icone: ['✦'],
    separador: [''],
    cartao: ['Serviço', '30 min · R$ 00'],
    selo: ['Novidade'],
    contato: ['WhatsApp', '(00) 00000-0000']
  };
  var T = {
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

  var FX_DEF = { anim: 'none', speed: 'med', shadow: 'soft', radius: 'soft' };
  var RAD = { sq: 0, soft: 16, round: 999 };
  var SHA = { none: 'none', soft: '0 8px 22px rgba(0,0,0,.16)', hard: '0 26px 56px rgba(0,0,0,.42)' };
  var SPD = { fast: 200, med: 350, slow: 650 };
  var FXLBL = {
    anim:   { none: 'Nenhuma', fade: 'Suave', up: 'Subir', zoom: 'Zoom' },
    speed:  { fast: 'Rápida', med: 'Média', slow: 'Lenta' },
    shadow: { none: 'Sem', soft: 'Suave', hard: 'Marcante' },
    radius: { sq: 'Quadrado', soft: 'Suave', round: 'Redondo' }
  };
  var PAGE_DEF = { grad: false, dir: '135deg', int: 38, reveal: true, zoom: true };
  var DIRS = ['135deg', '90deg', '180deg', '45deg'];

  var H = [];
  var sel = null;
  var drag = null;
  var tab = 'el';
  var ioAnim = null;

  function mk(x) { return { id: ++uid, type: x[0], text: x[1] || '', sub: x[2] || '', img: '', fx: cp(FX_DEF) }; }
  function fromT(k) {
    var t = T[k] || T.branco;
    return { bg: t.bg, font: t.font, al: t.al, els: t.els.map(mk), page: cp(PAGE_DEF) };
  }
  function normalize(o) {
    if (!o || !o.els || !BG[o.bg] || !FONTS[o.font]) return null;
    if (!o.page) o.page = cp(PAGE_DEF);
    Object.keys(PAGE_DEF).forEach(function (k) { if (!(k in o.page)) o.page[k] = PAGE_DEF[k]; });
    o.els.forEach(function (e) {
      e.id = ++uid;
      if (!e.fx) e.fx = {};
      Object.keys(FX_DEF).forEach(function (k) { if (!(k in e.fx)) e.fx[k] = FX_DEF[k]; });
      if (!FXLBL.anim[e.fx.anim]) e.fx.anim = 'none';
      if (!FXLBL.speed[e.fx.speed]) e.fx.speed = 'med';
      if (!FXLBL.shadow[e.fx.shadow]) e.fx.shadow = 'soft';
      if (!FXLBL.radius[e.fx.radius]) e.fx.radius = 'soft';
      if (e.img && e.img.indexOf('data:image/') !== 0) e.img = '';
    });
    return o;
  }
  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { msg('Não foi possível salvar neste navegador.'); }
  }
  function msg(t) { var el = document.getElementById('msg'); if (el) el.textContent = t; }
  function push() { H.push(JSON.stringify(S)); if (H.length > 40) H.shift(); }
  function commit(fn, m, anim) {
    push(); fn(); save(); render(!anim);
    if (m) msg(m);
  }

  function pageBG(b) {
    if (!S.page.grad || b.bg.indexOf('gradient') > -1) return b.bg;
    var t = Math.max(0, Math.min(100, S.page.int)) / 100;
    return 'linear-gradient(' + S.page.dir + ',' + b.bg + ' 0%,' + mix(b.bg, b.acc, t) + ' 100%)';
  }
  function fxVars(f) {
    return '--er:' + RAD[f.radius] + 'px;--esh:' + SHA[f.shadow] + ';--ed:' + SPD[f.speed] + 'ms';
  }

  function elHTML(e) {
    switch (e.type) {
      case 'titulo': return '<h2>' + esc(e.text) + '</h2>';
      case 'texto': return '<p>' + esc(e.text) + '</p>';
      case 'botao': return '<span class="pb">' + esc(e.text) + '</span>';
      case 'imagem': return e.img
        ? '<img src="' + e.img + '" alt="' + esc(e.text) + '">'
        : '<div class="ph">' + esc(e.text || 'Imagem') + '</div>';
      case 'icone': return '<span class="ic" aria-hidden="true">' + esc(e.text) + '</span>';
      case 'separador': return '<hr>';
      case 'cartao':
      case 'contato': return '<div class="pc"><b>' + esc(e.text) + '</b><span>' + esc(e.sub) + '</span></div>';
      case 'selo': return '<span class="sl">' + esc(e.text) + '</span>';
    }
    return '';
  }

  function render(silent) {
    if (!S) return;
    var b = BG[S.bg], p = document.getElementById('page');
    if (!p) return;
    p.className = 'page f-' + S.font + (silent ? ' still' : '') + (S.page.zoom ? ' zoomable' : '');
    p.style.cssText = '--pbg:' + b.bg + ';--pfg:' + b.fg + ';--pacc:' + b.acc + ';--pon:' + b.on + ';--pcard:' + b.card +
      ';--al:' + (S.al === 'left' ? 'flex-start' : 'center') + ';--ta:' + S.al + ';background:' + pageBG(b);

    p.innerHTML = S.els.map(function (e, i) {
      var fx = e.fx || FX_DEF;
      var anim = fx.anim && fx.anim !== 'none' ? ' data-anim="' + fx.anim + '"' : '';
      return '<div class="el' + (e.type === 'imagem' ? ' el-img' : '') + (i === sel ? ' sel' : '') +
        '" data-i="' + i + '"' + anim +
        ' style="' + fxVars(fx) + '" tabindex="0" role="button" draggable="true" aria-label="Editar ' +
        (LBL[e.type] || 'elemento').toLowerCase() + '">' +
        elHTML(e) + '</div>';
    }).join('') + '<div class="pf">Criado com JEITO</div>';

    var n = S.els.length;
    var cnt = document.getElementById('cnt');
    if (cnt) cnt.textContent = n + ' elemento' + (n === 1 ? '' : 's');
    var undo = document.getElementById('undo');
    if (undo) undo.disabled = !H.length;

    var ed = document.getElementById('edit');
    var e = S.els[sel];
    if (ed) ed.hidden = !e;
    if (e) {
      var etype = document.getElementById('etype');
      if (etype) etype.textContent = (LBL[e.type] || 'Elemento') + ' selecionado';
      var ft = document.getElementById('f-t');
      var fd = document.getElementById('f-d');
      var fi = document.getElementById('f-i');
      if (ft) ft.hidden = e.type === 'separador';
      if (fd) fd.hidden = !(e.type === 'cartao' || e.type === 'contato');
      if (fi) fi.hidden = e.type !== 'imagem';
      var et = document.getElementById('et');
      var ed2 = document.getElementById('ed');
      var rm = document.getElementById('rmimg');
      if (et) {
        et.value = e.text;
        if (et.previousElementSibling) {
          et.previousElementSibling.textContent =
            (e.type === 'cartao' || e.type === 'contato') ? 'Título' : 'Texto do elemento';
        }
      }
      if (ed2) ed2.value = e.sub;
      if (rm) rm.hidden = !e.img;
    }
    tools();
    observeAnims(silent);
  }

  function observeAnims(silent) {
    if (silent || !S) return;
    var p = document.getElementById('page');
    if (!p) return;
    var els = $$('.el[data-anim]', p);
    if (!els.length) return;
    if (!S.page.reveal || reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    if (ioAnim) ioAnim.disconnect();
    ioAnim = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add('in'); ioAnim.unobserve(x.target); }
      });
    }, { threshold: 0.15 });
    els.forEach(function (e) { ioAnim.observe(e); });
  }

  function chips(k, cur, dis) {
    return '<div class="chips">' + Object.keys(FXLBL[k]).map(function (v) {
      return '<button class="b" data-fx="' + k + '" data-v="' + v + '" aria-pressed="' +
        (cur === v) + '"' + dis + '>' + FXLBL[k][v] + '</button>';
    }).join('') + '</div>';
  }
  function fprevHTML() {
    var e = S.els[sel], fx = e ? e.fx : FX_DEF;
    var anim = fx.anim !== 'none' ? ' data-anim="' + fx.anim + '"' : '';
    return '<h2 style="margin-top:18px">Prévia do resultado</h2>' +
      '<div class="fprev" id="fprev"' + anim + ' style="' + fxVars(fx) + '">' +
        '<span class="sl">Seu negócio</span>' +
        '<b>Uma página com personalidade.</b>' +
        '<span class="pb">Conhecer serviços ↗</span>' +
      '</div>' +
      '<div class="row"><button class="b" id="replay">Reproduzir prévia</button></div>';
  }
  function fxPanel() {
    var e = S.els[sel], fx = e ? e.fx : FX_DEF, dis = e ? '' : ' disabled';
    var h = '<h2>Efeitos</h2>';
    h += '<p class="hint">' + (e
      ? 'Ajuste os efeitos do elemento <b>' + (LBL[e.type] || '').toLowerCase() + '</b> selecionado.'
      : 'Selecione um elemento na página para ajustar animação, sombra e cantos.') + '</p>';
    h += '<label>Animação de entrada</label>' + chips('anim', fx.anim, dis);
    h += '<label>Velocidade</label>' + chips('speed', fx.speed, dis);
    h += '<label>Sombra do cartão</label>' + chips('shadow', fx.shadow, dis);
    h += '<label>Arredondamento</label>' + chips('radius', fx.radius, dis);
    if (e) h += '<div class="row"><button class="b" data-fxall>Aplicar a todos os elementos</button></div>';

    h += '<h2 style="margin-top:18px">Página</h2>';
    h += '<div class="list">';
    h += '<button class="b" data-pg="grad" aria-pressed="' + !!S.page.grad + '">Fundo em gradiente</button>';
    h += '<button class="b" data-pg="reveal" aria-pressed="' + !!S.page.reveal + '">Revelar ao rolar</button>';
    h += '<button class="b" data-pg="zoom" aria-pressed="' + !!S.page.zoom + '">Zoom nas imagens</button>';
    h += '</div>';
    if (S.page.grad) {
      h += '<label>Direção do gradiente</label><div class="chips">' + DIRS.map(function (d) {
        return '<button class="b" data-dir="' + d + '" aria-pressed="' + (S.page.dir === d) + '">' +
          d.replace('deg', '°') + '</button>';
      }).join('') + '</div>';
      h += '<label for="pgint">Intensidade — ' + S.page.int + '%</label>' +
        '<input type="range" id="pgint" min="0" max="100" step="1" value="' + S.page.int + '">';
    }
    h += fprevHTML();
    h += '<div class="row"><button class="b" data-copy>Copiar configuração dos efeitos</button></div>';
    return h;
  }
  function tools() {
    if (!S) return;
    var tabsEl = document.getElementById('tabs');
    var tpEl = document.getElementById('tp');
    if (!tabsEl || !tpEl) return;

    var tb = [['el', 'Elementos'], ['tx', 'Texto'], ['bg', 'Fundo'], ['md', 'Modelos'], ['fx', 'Efeitos']];
    tabsEl.innerHTML = tb.map(function (t) {
      return '<button class="b" role="tab" data-tab="' + t[0] + '" aria-pressed="' + (tab == t[0]) + '">' + t[1] + '</button>';
    }).join('');

    var h = '';
    if (tab === 'el') {
      h = '<h2>Elementos</h2><p class="hint">Toque para adicionar à página.</p><div class="grid">' +
        Object.keys(LBL).map(function (k) { return '<button class="b" data-add="' + k + '">' + LBL[k] + '</button>'; }).join('') + '</div>';
    }
    if (tab === 'tx') {
      h = '<h2>Estilo do texto</h2><div class="list">' + Object.keys(FONTS).map(function (k) {
        return '<button class="b" data-font="' + k + '" aria-pressed="' + (S.font == k) + '">' + FONTS[k] + '</button>';
      }).join('') + '</div><h2 style="margin-top:16px">Alinhamento</h2><div class="row">' +
        '<button class="b" data-al="left" aria-pressed="' + (S.al == 'left') + '">Esquerda</button>' +
        '<button class="b" data-al="center" aria-pressed="' + (S.al == 'center') + '">Centro</button></div>';
    }
    if (tab === 'bg') {
      h = '<h2>Fundos</h2><div class="sw">' + Object.keys(BG).map(function (k) {
        return '<button data-bg="' + k + '" aria-label="Fundo ' + BG[k].n + '" aria-pressed="' + (S.bg == k) + '" style="background:' + BG[k].bg + '"></button>';
      }).join('') + '</div>';
   
