(function () {
  'use strict';

  /* ============================================================
     0. UTILIDADES
     ============================================================ */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function cp(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
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

  /* ============================================================
     1. ROTEADOR SIMPLES — #site / #studio
     ============================================================ */
  var started = false;
  function route() {
    var inStudio = location.hash === '#studio';
    $('#studio').hidden = !inStudio;
    $('#site').hidden = inStudio;
    window.scrollTo(0, 0);
    if (inStudio && !started) { started = true; boot(); }
  }
  window.addEventListener('hashchange', route);

  /* ============================================================
     2. SITE — mockups, menu, revelação, parallax, formulário
     ============================================================ */

  /* Configuração do formulário de interesse (lista de espera).
     Preencha ao conectar o Supabase. Use SOMENTE a chave anon (pública), nunca a service_role.
     endpoint: 'https://SEU-PROJETO.supabase.co/rest/v1/leads'
     Tabela sugerida (RLS ligado, apenas INSERT para anon):
       create table public.leads (id uuid primary key default gen_random_uuid(),
         nome text not null check (char_length(nome) between 2 and 80),
         email text not null check (char_length(email) between 5 and 120),
         negocio text not null check (char_length(negocio) between 2 and 80),
         plano text not null check (plano in ('inicial','pro','indeciso')),
         created_at timestamptz not null default now());
       alter table public.leads enable row level security;
       create policy leads_insert on public.leads for insert to anon with check (true);
       revoke all on public.leads from anon; grant insert on public.leads to anon; */
  var CONFIG = { endpoint: '', apikey: '' };

  /* Dados dos negócios fictícios de demonstração */
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
    var d = M[k];
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

  /* Cabeçalho: sombra ao rolar + parallax leve no hero */
  var hd = document.getElementById('hd');
  var vis = document.getElementById('vis');
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (hd) {
      var on = y > 8;
      hd.classList.toggle('on', on);
      hd.classList.toggle('scrolled', on);
    }
    var siteEl = document.getElementById('site');
    if (vis && !reduceMotion && siteEl && !siteEl.hidden) {
      vis.style.transform = 'translateY(' + Math.min(y, 700) * 0.055 + 'px)';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* Menu móvel */
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

  /* Botões de plano pré-selecionam o plano no formulário */
  $$('[data-plano]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.getElementById('plano');
      if (sel) sel.value = a.getAttribute('data-plano');
    });
  });

  /* Formulário de interesse: resultado real, sem fingir sucesso */
  var f = document.getElementById('lead');
  var st = document.getElementById('fstatus');
  var btn = document.getElementById('send');
  function formMsg(t, c) { if (!st) return; st.textContent = t; st.className = c || ''; }
  if (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      if (!CONFIG.endpoint) {
        formMsg('O formulário ainda não está conectado a um destino. Configure CONFIG em script.js.', 'err');
        return;
      }
      var d = new FormData(f);
      if (btn) btn.disabled = true;
      formMsg('Enviando…');
      fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: CONFIG.apikey,
          Authorization: 'Bearer ' + CONFIG.apikey,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          nome: d.get('nome').trim(),
          email: d.get('email').trim(),
          negocio: d.get('negocio').trim(),
          plano: d.get('plano')
        })
      }).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        f.reset();
        formMsg('Recebemos seu interesse. Entraremos em contato pelo e-mail informado.', 'ok');
      }).catch(function () {
        formMsg('Não foi possível enviar agora. Tente novamente em instantes.', 'err');
      }).then(function () { if (btn) btn.disabled = false; });
    });
  }

  /* Revelação ao rolar */
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

  /* ============================================================
     3. JEITO STUDIO
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

  /* ---- EFEITOS ---- */
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

  var KEY = 'jeito-studio-v2', S, H = [], sel = null, drag = null, tab = 'el', uid = 0, ioAnim = null;

  /* ---- modelo ---- */
  function mk(x) { return { id: ++uid, type: x[0], text: x[1] || '', sub: x[2] || '', img: '', fx: cp(FX_DEF) }; }
  function fromT(k) {
    var t = T[k];
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
  function msg(t) { $('#msg').textContent = t; }
  function push() { H.push(JSON.stringify(S)); if (H.length > 40) H.shift(); }
  function commit(fn, m, anim) {
    push(); fn(); save();
    render(!anim);
    if (m) msg(m);
  }

  /* ---- fundo com gradiente ---- */
  function pageBG(b) {
    if (!S.page.grad || b.bg.indexOf('gradient') > -1) return b.bg;
    var t = Math.max(0, Math.min(100, S.page.int)) / 100;
    return 'linear-gradient(' + S.page.dir + ',' + b.bg + ' 0%,' + mix(b.bg, b.acc, t) + ' 100%)';
  }
  /* ---- variáveis de efeito por elemento ---- */
  function fxVars(f) {
    return '--er:' + RAD[f.radius] + 'px;--esh:' + SHA[f.shadow] + ';--ed:' + SPD[f.speed] + 'ms';
  }

  /* ---- markup dos elementos ---- */
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

  /* ---- render ---- */
  function render(silent) {
    var b = BG[S.bg], p = $('#page');
    p.className = 'page f-' + S.font + (silent ? ' still' : '') + (S.page.zoom ? ' zoomable' : '');
    p.style.cssText = '--pbg:' + b.bg + ';--pfg:' + b.fg + ';--pacc:' + b.acc + ';--pon:' + b.on + ';--pcard:' + b.card +
      ';--al:' + (S.al === 'left' ? 'flex-start' : 'center') + ';--ta:' + S.al + ';background:' + pageBG(b);

    p.innerHTML = S.els.map(function (e, i) {
      var fx = e.fx;
      var anim = fx.anim !== 'none' ? ' data-anim="' + fx.anim + '"' : '';
      return '<div class="el' + (e.type === 'imagem' ? ' el-img' : '') + (i === sel ? ' sel' : '') +
        '" data-i="' + i + '"' + anim +
        ' style="' + fxVars(fx) + '" tabindex="0" role="button" draggable="true" aria-label="Editar ' + LBL[e.type].toLowerCase() + '">' +
        elHTML(e) + '</div>';
    }).join('') + '<div class="pf">Criado com JEITO</div>';

    var n = S.els.length;
    $('#cnt').textContent = n + ' elemento' + (n === 1 ? '' : 's');
    $('#undo').disabled = !H.length;

    var ed = $('#edit'), e = S.els[sel];
    ed.hidden = !e;
    if (e) {
      $('#etype').textContent = LBL[e.type] + ' selecionado';
      $('#f-t').hidden = e.type === 'separador';
      $('#f-d').hidden = !(e.type === 'cartao' || e.type === 'contato');
      $('#f-i').hidden = e.type !== 'imagem';
      $('#et').value = e.text;
      $('#ed').value = e.sub;
      $('#rmimg').hidden = !e.img;
      $('#et').previousElementSibling.textContent =
        (e.type === 'cartao' || e.type === 'contato') ? 'Título' : 'Texto do elemento';
    }
    tools();
    observeAnims(silent);
  }

  /* ---- animações de entrada (scroll reveal) ---- */
  function observeAnims(silent) {
    if (silent) return;
    var p = $('#page');
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

  /* ---- painel de ferramentas ---- */
  function chips(k, cur, dis) {
    return '<div class="chips">' + Object.keys(FXLBL[k]).map(function (v) {
      return '<button class="b" data-fx="' + k + '" data-v="' + v + '" aria-pressed="' + (cur === v) + '"' + dis + '>' + FXLBL[k][v] + '</button>';
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
      ? 'Ajuste os efeitos do elemento <b>' + LBL[e.type].toLowerCase() + '</b> selecionado.'
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
        return '<button class="b" data-dir="' + d + '" aria-pressed="' + (S.page.dir === d) + '">' + d.replace('deg', '°') + '</button>';
      }).join('') + '</div>';
      h += '<label for="pgint">Intensidade — ' + S.page.int + '%</label>' +
        '<input type="range" id="pgint" min="0" max="100" step="1" value="' + S.page.int + '">';
    }
    h += fprevHTML();
    h += '<div class="row"><button class="b" data-copy>Copiar configuração dos efeitos</button></div>';
    return h;
  }
  function tools() {
    var tb = [['el', 'Elementos'], ['tx', 'Texto'], ['bg', 'Fundo'], ['md', 'Modelos'], ['fx', 'Efeitos']];
    $('#tabs').innerHTML = tb.map(function (t) {
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
    }
    if (tab === 'md') {
      h = '<h2>Modelos</h2><p class="hint">Aplicar um modelo troca o conteúdo da página. Você pode desfazer.</p><div class="list">' +
        Object.keys(T).map(function (k) { return '<button class="b" data-tpl="' + k + '">' + T[k].n + '</button>'; }).join('') + '</div>';
    }
    if (tab === 'fx') h = fxPanel();

    $('#tp').innerHTML = h;
    if (tab === 'fx') {
      requestAnimationFrame(function () {
        var fp = $('#fprev');
        if (fp) fp.classList.add('in');
      });
    }
  }

  /* ---- eventos do editor ---- */
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-tab],[data-add],[data-font],[data-al],[data-bg],[data-tpl],[data-fx],[data-fxall],[data-pg],[data-dir],[data-copy],#replay,.el');
    if (!t) return;

    if (t.id === 'replay') {
      var fp = $('#fprev');
      if (fp) { fp.classList.remove('in'); void fp.offsetWidth; fp.classList.add('in'); }
      return;
    }
    if (t.dataset.tab) { tab = t.dataset.tab; tools(); return; }

    /* efeitos por elemento */
    if (t.dataset.fx !== undefined && t.dataset.fx !== '') {
      if (sel == null) return;
      var k = t.dataset.fx, v = t.dataset.v;
      commit(function () { S.els[sel].fx[k] = v; }, null, true);
      return;
    }
    if (t.hasAttribute('data-fxall')) {
      if (sel == null) return;
      commit(function () {
        var base = cp(S.els[sel].fx);
        S.els.forEach(function (x) { x.fx = cp(base); });
      }, 'Efeitos aplicados a todos os elementos.', true);
      return;
    }
    if (t.dataset.pg) {
      var p = t.dataset.pg;
      commit(function () { S.page[p] = !S.page[p]; }, null, true);
      return;
    }
    if (t.dataset.dir) {
      commit(function () { S.page.dir = t.dataset.dir; }, null, true);
      return;
    }
    if (t.hasAttribute('data-copy')) {
      var payload = JSON.stringify({
        elemento: S.els[sel] ? { tipo: S.els[sel].type, efeitos: S.els[sel].fx } : null,
        pagina: S.page
      }, null, 2);
      copyText(payload);
      return;
    }

    /* conteúdo */
    if (t.dataset.add) {
      var kk = t.dataset.add, d = DEF[kk];
      commit(function () {
        var i = sel == null ? S.els.length : sel + 1;
        S.els.splice(i, 0, mk([kk, d[0], d[1]]));
        sel = i;
      }, LBL[kk] + ' adicionado.', true);
      return;
    }
    if (t.dataset.font) { commit(function () { S.font = t.dataset.font; }, 'Estilo de texto aplicado.', true); return; }
    if (t.dataset.al) { commit(function () { S.al = t.dataset.al; }); return; }
    if (t.dataset.bg) { commit(function () { S.bg = t.dataset.bg; }, 'Fundo aplicado.', true); return; }
    if (t.dataset.tpl) {
      commit(function () { S = fromT(t.dataset.tpl); sel = null; }, 'Modelo aplicado. Use Desfazer para voltar.', true);
      return;
    }
    if (t.classList.contains('el')) {
      sel = +t.dataset.i; render(true); msg('');
    }
  });

  /* intensidade do gradiente (sem re-render para não perder o foco) */
  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'pgint') {
      S.page.int = +ev.target.value;
      save();
      var b = BG[S.bg];
      $('#page').style.background = pageBG(b);
      var lab = ev.target.previousElementSibling;
      if (lab && lab.tagName === 'LABEL') lab.textContent = 'Intensidade — ' + S.page.int + '%';
    }
  });

  /* cópia para a área de transferência */
  function copyText(txt) {
    function done() { msg('Configuração dos efeitos copiada.'); }
    function fail() { msg('Não foi possível copiar automaticamente. Selecione e copie do console.'); console.log(txt); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, fail);
    } else {
      try {
        var ta = document.createElement('textarea');
        ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta); done();
      } catch (e) { fail(); }
    }
  }

  /* teclado */
  document.addEventListener('keydown', function (ev) {
    var el = ev.target.closest && ev.target.closest('.el');
    if (el && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); sel = +el.dataset.i; render(true); }
    var typing = /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName);
    if (ev.key === 'Delete' && sel != null && !typing) del();
    if (ev.key === 'Escape' && sel != null) { sel = null; render(true); }
  });

  /* ações do painel */
  function del() { if (sel == null) return; commit(function () { S.els.splice(sel, 1); sel = null; }, 'Elemento excluído.'); }
  function mv(d) {
    var j = sel + d;
    if (sel == null || j < 0 || j >= S.els.length) return;
    commit(function () { var m = S.els.splice(sel, 1)[0]; S.els.splice(j, 0, m); sel = j; }, null, true);
  }
  $('#apply').onclick = function () {
    if (sel == null) return;
    var e = S.els[sel]; if (!e) return;
    commit(function () { e = S.els[sel]; e.text = $('#et').value; e.sub = $('#ed').value; }, 'Alteração aplicada.');
  };
  $('#del').onclick = del;
  $('#up').onclick = function () { mv(-1); };
  $('#down').onclick = function () { mv(1); };
  $('#dup').onclick = function () {
    if (sel == null) return;
    commit(function () {
      var c = cp(S.els[sel]); c.id = ++uid; S.els.splice(sel + 1, 0, c); sel++;
    }, 'Elemento duplicado.', true);
  };
  $('#undo').onclick = function () {
    if (!H.length) return;
    S = normalize(JSON.parse(H.pop())) || S;
    if (sel != null && sel >= S.els.length) sel = null;
    save(); render(); msg('Ação desfeita.');
  };
  $('#rmimg').onclick = function () {
    if (sel == null) return;
    commit(function () { S.els[sel].img = ''; }, 'Imagem removida.');
  };
  $('#ei').onchange = function () {
    var file = this.files[0], i = sel; this.value = '';
    if (!file || i == null) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { msg('Use PNG, JPEG ou WebP.'); return; }
    if (file.size > 1500000) { msg('Imagem grande demais. Use um arquivo de até 1,5 MB.'); return; }
    var r = new FileReader();
    r.onload = function () {
      if (S.els[i]) commit(function () { S.els[i].img = String(r.result); }, 'Imagem adicionada.', true);
    };
    r.onerror = function () { msg('Não foi possível ler o arquivo.'); };
    r.readAsDataURL(file);
  };
  $('#vd').onclick = function () { view(false); };
  $('#vm').onclick = function () { view(true); };
  function view(m) {
    $('#frame').classList.toggle('m', m);
    $('#vd').setAttribute('aria-pressed', !m);
    $('#vm').setAttribute('aria-pressed', m);
  }

  /* arrastar e soltar (computador) */
  var pg = $('#page');
  pg.addEventListener('dragstart', function (e) {
    var el = e.target.closest('.el');
    if (el) { drag = +el.dataset.i; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'x'); }
  });
  pg.addEventListener('dragover', function (e) { if (drag != null) e.preventDefault(); });
  pg.addEventListener('drop', function (e) {
    var el = e.target.closest('.el');
    if (el && drag != null) {
      e.preventDefault();
      var to = +el.dataset.i, from = drag; drag = null;
      if (to !== from) commit(function () {
        var m = S.els.splice(from, 1)[0]; S.els.splice(to, 0, m); sel = to;
      }, 'Elemento movido.', true);
    }
  });
  pg.addEventListener('dragend', function () { drag = null; });

  /* ---- boot ---- */
  function boot() {
    S = load() || fromT('branco');
    sel = null;
    render();
  }

  /* inicia roteador */
  route();
})();
