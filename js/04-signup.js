window.JEITO = window.JEITO || {};
(function (J) {
  'use strict';
  var $ = J.$, $$ = J.$$, esc = J.esc, cp = J.cp, slugify = J.slugify;

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
    var st = J.state;
    var el = document.getElementById('sp-prev');
    if (!el || !st.SP) return;
    var SP = st.SP;
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
      b.setAttribute('aria-pressed', b.getAttribute('data-tpl') === J.state.SP.tpl ? 'true' : 'false');
    });
  }

  function renderServices() {
    var SP = J.state.SP;
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
    var SP = J.state.SP;
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
    var SP = J.state.SP;
    if (!SP) return;
    SP.step = Math.max(1, Math.min(5, n));
    $$('#sp-form .sp-step').forEach(function (s) { s.hidden = +s.dataset.step !== SP.step; });
    $$('#steps-bar li').forEach(function (li) {
      var sn = +li.dataset.step;
      li.classList.toggle('on', sn === SP.step);
      li.classList.toggle('done', sn < SP.step);
    });
    var st = STEPS[SP.step - 1];
    var title = document.getElementById('sp-title');
    var sub   = document.getElementById('sp-sub');
    var next  = document.getElementById('sp-next');
    var back  = document.getElementById('sp-back');
    if (title) title.textContent = SP.step === 1 ? 'Comece do seu jeito.' : st.n;
    if (sub)   sub.textContent   = st.sub;
    if (next)  next.textContent  = st.btn;
    if (back)  back.hidden = SP.step === 1;

    if (SP.step === 3) renderTplSelect();
    if (SP.step === 4) renderServices();
    if (SP.step === 5) renderReview();
    renderPreview();
    var status = document.getElementById('sp-status');
    if (status) { status.textContent = ''; status.className = 'sp-status'; }
  }

  function spValidate() {
    var SP = J.state.SP;
    var status = document.getElementById('sp-status');
    function err(m) { if (status) { status.textContent = m; status.className = 'sp-status err'; } return false; }
    if (status) { status.textContent = ''; status.className = 'sp-status'; }

    if (SP.step === 1) {
      var nome  = ((document.getElementById('sp-nome')  || {}).value || '').trim();
      var email = ((document.getElementById('sp-email') || {}).value || '').trim();
      var senha = (document.getElementById('sp-senha') || {}).value || '';
      if (nome.length < 2) return err('Informe seu nome.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('Informe um e-mail válido.');
      if (senha.length < 6) return err('A senha precisa ter pelo menos 6 caracteres.');
      SP.conta = { nome: nome, email: email, senha: senha };
    }
    if (SP.step === 2) {
      var negEl  = document.getElementById('sp-negocio');
      var catEl  = document.getElementById('sp-categoria');
      var wppEl  = document.getElementById('sp-whats');
      var slugEl = document.getElementById('sp-slug');
      var neg  = (negEl ? negEl.value : '').trim();
      var cat  = catEl ? catEl.value : 'barbearia';
      var wpp  = (wppEl ? wppEl.value : '').trim();
      var slug = (slugEl ? slugEl.value : '').trim();
      if (neg.length < 2) return err('Informe o nome do negócio.');
      if (!slug) { slug = slugify(neg); if (slugEl) slugEl.value = slug; }
      SP.negocio = { nome: neg, categoria: cat, whatsapp: wpp, slug: slugify(slug) };
    }
    return true;
  }

  function spFinish() {
    var st = J.state, SP = st.SP;
    if (!SP) return;
    var tplKey = (SP.negocio.categoria && CAT_TPL[SP.negocio.categoria])
      ? CAT_TPL[SP.negocio.categoria]
      : (SP.tpl === 'branco' ? 'branco' : SP.tpl);
    var base = J.fromT(tplKey);

    var nome = SP.negocio.nome || 'Seu Negócio';
    var cat  = CATS[SP.negocio.categoria] || 'Novo';
    var svcs = SP.servicos.filter(function (s) { return s.nome; });

    var els = [];
    els.push({ id: 0, type: 'selo',   text: cat,  sub: '', img: '', fx: cp(J.FX_DEF) });
    els.push({ id: 0, type: 'titulo', text: nome, sub: '', img: '', fx: cp(J.FX_DEF) });
    els.push({ id: 0, type: 'texto',  text: 'Bem-vindo(a). Conheça nossos serviços e fale com a gente.', sub: '', img: '', fx: cp(J.FX_DEF) });
    els.push({ id: 0, type: 'botao',  text: 'Falar no WhatsApp', sub: '', img: '', fx: cp(J.FX_DEF) });
    if (svcs.length) els.push({ id: 0, type: 'separador', text: '', sub: '', img: '', fx: cp(J.FX_DEF) });
    svcs.forEach(function (s) {
      var meta = [s.dur, s.preco].filter(Boolean).join(' · ');
      els.push({ id: 0, type: 'cartao', text: s.nome, sub: meta, img: '', fx: cp(J.FX_DEF) });
    });
    if (SP.negocio.whatsapp) {
      els.push({ id: 0, type: 'contato', text: 'WhatsApp', sub: SP.negocio.whatsapp, img: '', fx: cp(J.FX_DEF) });
    }
    els.forEach(function (e) { e.id = ++st.uid; });

    st.S = { bg: base.bg, font: base.font, al: base.al, els: els, page: cp(J.PAGE_DEF) };
    try { localStorage.setItem(st.KEY, JSON.stringify(st.S)); } catch (e) { /* ignore */ }

    st.H = [];
    st.sel = null;
    st.SP = null;
    st.started = false;
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
        if (!J.state.SP) return;
        J.state.SP.tpl = b.getAttribute('data-tpl');
        renderTplSelect();
        renderPreview();
      });
    });

    var addsv = document.getElementById('sp-addsv');
    if (addsv) addsv.addEventListener('click', function () {
      if (!J.state.SP) return;
      J.state.SP.servicos.push({ nome: '', dur: '', preco: '' });
      renderServices();
    });

    var svlist = document.getElementById('sp-svlist');
    if (svlist) {
      svlist.addEventListener('input', function (ev) {
        var SP = J.state.SP;
        if (!SP) return;
        var row = ev.target.closest('.sv-row');
        if (!row) return;
        var i = +row.dataset.i, s = SP.servicos[i];
        if (!s) return;
        if (ev.target.classList.contains('sv-n')) s.nome  = ev.target.value;
        if (ev.target.classList.contains('sv-p')) s.preco = ev.target.value;
        if (ev.target.classList.contains('sv-d')) s.dur   = ev.target.value;
        renderPreview();
      });
      svlist.addEventListener('click', function (ev) {
        var SP = J.state.SP;
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

    var negInput  = document.getElementById('sp-negocio');
    var slugInput = document.getElementById('sp-slug');
    if (negInput && slugInput) {
      var slugTouched = false;
      slugInput.addEventListener('input', function () { slugTouched = slugInput.value.length > 0; });
      negInput.addEventListener('input', function () {
        if (!slugTouched) slugInput.value = slugify(negInput.value);
      });
    }

    var back = document.getElementById('sp-back');
    if (back) back.addEventListener('click', function () {
      if (J.state.SP && J.state.SP.step > 1) spGo(J.state.SP.step - 1);
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!J.state.SP) return;
      if (J.state.SP.step === 5) { spFinish(); return; }
      if (!spValidate()) return;
      spGo(J.state.SP.step + 1);
    });
  }

  function init() {
    var fresh = !J.state.SP;
    if (!J.state.SP) J.state.SP = spInit();
    var form = document.getElementById('sp-form');
    if (!form) return;
    if (form.dataset.bound !== '1') {
      form.dataset.bound = '1';
      bindSignupHandlers(form);
    }
    spGo(fresh ? 1 : J.state.SP.step);
  }

  J.signup = { init: init };
})(window.JEITO);