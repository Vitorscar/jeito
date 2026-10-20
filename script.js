(function () {
  'use strict';

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

  document.querySelectorAll('[data-mock]').forEach(function (el) {
    el.innerHTML = mock(el.getAttribute('data-mock'), el.hasAttribute('data-phone'));
  });

  /* Cabeçalho: sombra ao rolar e menu móvel */
  var hd = document.getElementById('hd');
  var menu = document.getElementById('menu');
  var nav = document.getElementById('nav');
  function onScroll() { hd.classList.toggle('on', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  menu.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* Botões de plano pré-selecionam o plano no formulário */
  document.querySelectorAll('[data-plano]').forEach(function (a) {
    a.addEventListener('click', function () { document.getElementById('plano').value = a.getAttribute('data-plano'); });
  });

  /* Formulário de interesse: resultado real, sem fingir sucesso */
  var f = document.getElementById('lead');
  var st = document.getElementById('fstatus');
  var btn = document.getElementById('send');
  function msg(t, c) { st.textContent = t; st.className = c || ''; }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    if (!CONFIG.endpoint) {
      msg('O formulário ainda não está conectado a um destino. Configure CONFIG em script.js.', 'err');
      return;
    }
    var d = new FormData(f);
    btn.disabled = true;
    msg('Enviando…');
    fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CONFIG.apikey, Authorization: 'Bearer ' + CONFIG.apikey, Prefer: 'return=minimal' },
      body: JSON.stringify({ nome: d.get('nome').trim(), email: d.get('email').trim(), negocio: d.get('negocio').trim(), plano: d.get('plano') })
    }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      f.reset();
      msg('Recebemos seu interesse. Entraremos em contato pelo e-mail informado.', 'ok');
    }).catch(function () {
      msg('Não foi possível enviar agora. Tente novamente em instantes.', 'err');
    }).then(function () { btn.disabled = false; });
  });
})();
