window.JEITO = window.JEITO || {};
(function (J) {
  'use strict';
  var $ = J.$, $$ = J.$$, esc = J.esc, cp = J.cp, mix = J.mix, reduceMotion = J.reduceMotion;

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
  var RAD = { sq: 0, soft: 16, round: 999 };
  var SHA = { none: 'none', soft: '0 8px 22px rgba(0,0,0,.16)', hard: '0 26px 56px rgba(0,0,0,.42)' };
  var SPD = { fast: 200, med: 350, slow: 650 };
  var DIRS = ['135deg', '90deg', '180deg', '45deg'];

  /* ---- helpers de estado ---- */
  function msg(t) { var el = document.getElementById('msg'); if (el) el.textContent = t; }
  function push() { var st = J.state; st.H.push(JSON.stringify(st.S)); if (st.H.length > 40) st.H.shift(); }
  function commit(fn, m, anim) {
    push(); fn(); J.save(); render(!anim);
    if (m) msg(m);
  }

  function pageBG(b) {
    var st = J.state;
    if (!st.S.page.grad || b.bg.indexOf('gradient') > -1) return b.bg;
    var t = Math.max(0, Math.min(100, st.S.page.int)) / 100;
    return 'linear-gradient(' + st.S.page.dir + ',' + b.bg + ' 0%,' + mix(b.bg, b.acc, t) + ' 100%)';
  }
  function fxVars(f) {
    return '--er:' + RAD[f.radius] + 'px;--esh:' + SHA[f.shadow] + ';--ed:' + SPD[f.speed] + 'ms';
  }

  function elHTML(e) {
    switch (e.type) {
      case 'titulo': return '<h2>' + esc(e.text) + '</h2>';
      case 'texto':  return '<p>' + esc(e.text) + '</p>';
      case 'botao':  return '<span class="pb">' + esc(e.text) + '</span>';
      case 'imagem': return e.img
        ? '<img src="' + e.img + '" alt="' + esc(e.text) + '">'
        : '<div class="ph">' + esc(e.text || 'Imagem') + '</div>';
      case 'icone':     return '<span class="ic" aria-hidden="true">' + esc(e.text) + '</span>';
      case 'separador': return '<hr>';
      case 'cartao':
      case 'contato':   return '<div class="pc"><b>' + esc(e.text) + '</b><span>' + esc(e.sub) + '</span></div>';
      case 'selo':      return '<span class="sl">' + esc(e.text) + '</span>';
    }
    return '';
  }

  function render(silent) {
    var st = J.state;
    if (!st.S) return;
    var b = J.BG[st.S.bg], p = document.getElementById('page');
    if (!p) return;
    p.className = 'page f-' + st.S.font + (silent ? ' still' : '') + (st.S.page.zoom ? ' zoomable' : '');
    p.style.cssText = '--pbg:' + b.bg + ';--pfg:' + b.fg + ';--pacc:' + b.acc + ';--pon:' + b.on + ';--pcard:' + b.card +
      ';--al:' + (st.S.al === 'left' ? 'flex-start' : 'center') + ';--ta:' + st.S.al + ';background:' + pageBG(b);

    p.innerHTML = st.S.els.map(function (e, i) {
      var fx = e.fx || J.FX_DEF;
      var anim = fx.anim && fx.anim !== 'none' ? ' data-anim="' + fx.anim + '"' : '';
      return '<div class="el' + (e.type === 'imagem' ? ' el-img' : '') + (i === st.sel ? ' sel' : '') +
        '" data-i="' + i + '"' + anim +
        ' style="' + fxVars(fx) + '" tabindex="0" role="button" draggable="true" aria-label="Editar ' +
        (LBL[e.type] || 'elemento').toLowerCase() + '">' + elHTML(e) + '</div>';
    }).join('') + '<div class="pf">Criado com JEITO</div>';

    var n = st.S.els.length;
    var cnt = document.getElementById('cnt');
    if (cnt) cnt.textContent = n + ' elemento' + (n === 1 ? '' : 's');
    var undo = document.getElementById('undo');
    if (undo) undo.disabled = !st.H.length;

    var ed = document.getElementById('edit');
    var e = st.S.els[st.sel];
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
    var st = J.state;
    if (silent || !st.S) return;
    var p = document.getElementById('page');
    if (!p) return;
    var els = $$('.el[data-anim]', p);
    if (!els.length) return;
    if (!st.S.page.reveal || reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    if (st.ioAnim) st.ioAnim.disconnect();
    st.ioAnim = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add('in'); st.ioAnim.unobserve(x.target); }
      });
    }, { threshold: 0.15 });
    els.forEach(function (e) { st.ioAnim.observe(e); });
  }

  function chips(k, cur, dis) {
    return '<div class="chips">' + Object.keys(J.FXLBL[k]).map(function (v) {
      return '<button class="b" data-fx="' + k + '" data-v="' + v + '" aria-pressed="' +
        (cur === v) + '"' + dis + '>' + J.FXLBL[k][v] + '</button>';
    }).join('') + '</div>';
  }

  function fprevHTML() {
    var st = J.state;
    var e = st.S.els[st.sel], fx = e ? e.fx : J.FX_DEF;
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
    var st = J.state;
    var e = st.S.els[st.sel], fx = e ? e.fx : J.FX_DEF, dis = e ? '' : ' disabled';
    var h = '<h2>Efeitos</h2>';
    h += '<p class="hint">' + (e
      ? 'Ajuste os efeitos do elemento <b>' + (LBL[e.type] || '').toLowerCase() + '</b> selecionado.'
      : 'Selecione um elemento na página para ajustar animação, sombra e cantos.') + '</p>';
    h += '<label>Animação de entrada</label>' + chips('anim',   fx.anim,   dis);
    h += '<label>Velocidade</label>'         + chips('speed',  fx.speed,  dis);
    h += '<label>Sombra do cartão</label>'   + chips('shadow', fx.shadow, dis);
    h += '<label>Arredondamento</label>'     + chips('radius', fx.radius, dis);
    if (e) h += '<div class="row"><button class="b" data-fxall>Aplicar a todos os elementos</button></div>';

    h += '<h2 style="margin-top:18px">Página</h2><div class="list">';
    h += '<button class="b" data-pg="grad"   aria-pressed="' + !!st.S.page.grad   + '">Fundo em gradiente</button>';
    h += '<button class="b" data-pg="reveal" aria-pressed="' + !!st.S.page.reveal + '">Revelar ao rolar</button>';
    h += '<button class="b" data-pg="zoom"   aria-pressed="' + !!st.S.page.zoom   + '">Zoom nas imagens</button>';
    h += '</div>';
    if (st.S.page.grad) {
      h += '<label>Direção do gradiente</label><div class="chips">' + DIRS.map(function (d) {
        return '<button class="b" data-dir="' + d + '" aria-pressed="' + (st.S.page.dir === d) + '">' +
          d.replace('deg', '°') + '</button>';
      }).join('') + '</div>';
      h += '<label for="pgint">Intensidade — ' + st.S.page.int + '%</label>' +
        '<input type="range" id="pgint" min="0" max="100" step="1" value="' + st.S.page.int + '">';
    }
    h += fprevHTML();
    h += '<div class="row"><button class="b" data-copy>Copiar configuração dos efeitos</button></div>';
    return h;
  }

  function tools() {
    var st = J.state;
    if (!st.S) return;
    var tabsEl = document.getElementById('tabs');
    var tpEl   = document.getElementById('tp');
    if (!tabsEl || !tpEl) return;

    var tb = [['el', 'Elementos'], ['tx', 'Texto'], ['bg', 'Fundo'], ['md', 'Modelos'], ['fx', 'Efeitos']];
    tabsEl.innerHTML = tb.map(function (t) {
      return '<button class="b" role="tab" data-tab="' + t[0] + '" aria-pressed="' + (st.tab == t[0]) + '">' + t[1] + '</button>';
    }).join('');

    var h = '';
    if (st.tab === 'el') {
      h = '<h2>Elementos</h2><p class="hint">Toque para adicionar à página.</p><div class="grid">' +
        Object.keys(LBL).map(function (k) { return '<button class="b" data-add="' + k + '">' + LBL[k] + '</button>'; }).join('') + '</div>';
    }
    if (st.tab === 'tx') {
      h = '<h2>Estilo do texto</h2><div class="list">' + Object.keys(J.FONTS).map(function (k) {
        return '<button class="b" data-font="' + k + '" aria-pressed="' + (st.S.font == k) + '">' + J.FONTS[k] + '</button>';
      }).join('') + '</div><h2 style="margin-top:16px">Alinhamento</h2><div class="row">' +
        '<button class="b" data-al="left"   aria-pressed="' + (st.S.al == 'left')   + '">Esquerda</button>' +
        '<button class="b" data-al="center" aria-pressed="' + (st.S.al == 'center') + '">Centro</button></div>';
    }
    if (st.tab === 'bg') {
      h = '<h2>Fundos</h2><div class="sw">' + Object.keys(J.BG).map(function (k) {
        return '<button data-bg="' + k + '" aria-label="Fundo ' + J.BG[k].n + '" aria-pressed="' + (st.S.bg == k) + '" style="background:' + J.BG[k].bg + '"></button>';
      }).join('') + '</div>';
    }
    if (st.tab === 'md') {
      h = '<h2>Modelos</h2><p class="hint">Aplicar um modelo troca o conteúdo da página. Você pode desfazer.</p><div class="list">' +
        Object.keys(J.T).map(function (k) { return '<button class="b" data-tpl="' + k + '">' + J.T[k].n + '</button>'; }).join('') + '</div>';
    }
    if (st.tab === 'fx') h = fxPanel();

    tpEl.innerHTML = h;
    if (st.tab === 'fx') {
      requestAnimationFrame(function () {
        var fp = document.getElementById('fprev');
        if (fp) fp.classList.add('in');
      });
    }
  }

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

  function del() {
    var st = J.state;
    if (st.sel == null) return;
    commit(function () { st.S.els.splice(st.sel, 1); st.sel = null; }, 'Elemento excluído.');
  }
  function mv(d) {
    var st = J.state;
    var j = st.sel + d;
    if (st.sel == null || j < 0 || j >= st.S.els.length) return;
    commit(function () {
      var m = st.S.els.splice(st.sel, 1)[0];
      st.S.els.splice(j, 0, m);
      st.sel = j;
    }, null, true);
  }

  function bindStudioHandlers() {
    var st = J.state;

    document.addEventListener('click', function (ev) {
      var studio = document.getElementById('studio');
      if (!studio || studio.hidden) return;
      var t = ev.target.closest('[data-tab],[data-add],[data-font],[data-al],[data-bg],[data-tpl],[data-fx],[data-fxall],[data-pg],[data-dir],[data-copy],#replay,.el');
      if (!t) return;

      if (t.id === 'replay') {
        var fp = document.getElementById('fprev');
        if (fp) { fp.classList.remove('in'); void fp.offsetWidth; fp.classList.add('in'); }
        return;
      }
      if (t.dataset.tab) { st.tab = t.dataset.tab; tools(); return; }

      if (t.dataset.fx !== undefined && t.dataset.fx !== '') {
        if (st.sel == null) return;
        var k = t.dataset.fx, v = t.dataset.v;
        commit(function () { st.S.els[st.sel].fx[k] = v; }, null, true);
        return;
      }
      if (t.hasAttribute('data-fxall')) {
        if (st.sel == null) return;
        commit(function () {
          var base = cp(st.S.els[st.sel].fx);
          st.S.els.forEach(function (x) { x.fx = cp(base); });
        }, 'Efeitos aplicados a todos os elementos.', true);
        return;
      }
      if (t.dataset.pg) {
        var p = t.dataset.pg;
        commit(function () { st.S.page[p] = !st.S.page[p]; }, null, true);
        return;
      }
      if (t.dataset.dir) {
        commit(function () { st.S.page.dir = t.dataset.dir; }, null, true);
        return;
      }
      if (t.hasAttribute('data-copy')) {
        var payload = JSON.stringify({
          elemento: st.S.els[st.sel] ? { tipo: st.S.els[st.sel].type, efeitos: st.S.els[st.sel].fx } : null,
          pagina: st.S.page
        }, null, 2);
        copyText(payload);
        return;
      }
      if (t.dataset.add) {
        var kk = t.dataset.add, d = DEF[kk];
        commit(function () {
          var i = st.sel == null ? st.S.els.length : st.sel + 1;
          st.S.els.splice(i, 0, J.mk([kk, d[0], d[1]]));
          st.sel = i;
        }, LBL[kk] + ' adicionado.', true);
        return;
      }
      if (t.dataset.font) { commit(function () { st.S.font = t.dataset.font; }, 'Estilo de texto aplicado.', true); return; }
      if (t.dataset.al)   { commit(function () { st.S.al = t.dataset.al; }); return; }
      if (t.dataset.bg)   { commit(function () { st.S.bg = t.dataset.bg; }, 'Fundo aplicado.', true); return; }
      if (t.dataset.tpl)  {
        commit(function () { st.S = J.fromT(t.dataset.tpl); st.sel = null; }, 'Modelo aplicado. Use Desfazer para voltar.', true);
        return;
      }
      if (t.classList.contains('el')) {
        st.sel = +t.dataset.i; render(true); msg('');
      }
    });

    document.addEventListener('input', function (ev) {
      var studio = document.getElementById('studio');
      if (!studio || studio.hidden) return;
      if (ev.target.id === 'pgint' && st.S) {
        st.S.page.int = +ev.target.value;
        J.save();
        var b = J.BG[st.S.bg];
        var pg = document.getElementById('page');
        if (pg) pg.style.background = pageBG(b);
        var lab = ev.target.previousElementSibling;
        if (lab && lab.tagName === 'LABEL') lab.textContent = 'Intensidade — ' + st.S.page.int + '%';
      }
    });

    document.addEventListener('keydown', function (ev) {
      var studio = document.getElementById('studio');
      if (!studio || studio.hidden) return;
      var el = ev.target.closest && ev.target.closest('.el');
      if (el && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); st.sel = +el.dataset.i; render(true); }
      var typing = /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName);
      if (ev.key === 'Delete' && st.sel != null && !typing) del();
      if (ev.key === 'Escape' && st.sel != null) { st.sel = null; render(true); }
    });

    var apply = document.getElementById('apply');
    if (apply) apply.onclick = function () {
      if (st.sel == null) return;
      var e = st.S.els[st.sel]; if (!e) return;
      var et = document.getElementById('et');
      var ed = document.getElementById('ed');
      commit(function () {
        e = st.S.els[st.sel];
        if (et) e.text = et.value;
        if (ed) e.sub  = ed.value;
      }, 'Alteração aplicada.');
    };

    var delBtn   = document.getElementById('del');   if (delBtn)   delBtn.onclick   = del;
    var upBtn    = document.getElementById('up');    if (upBtn)    upBtn.onclick    = function () { mv(-1); };
    var downBtn  = document.getElementById('down');  if (downBtn)  downBtn.onclick  = function () { mv(1); };

    var dupBtn = document.getElementById('dup');
    if (dupBtn) dupBtn.onclick = function () {
      if (st.sel == null) return;
      commit(function () {
        var c = cp(st.S.els[st.sel]); c.id = ++st.uid;
        st.S.els.splice(st.sel + 1, 0, c);
        st.sel++;
      }, 'Elemento duplicado.', true);
    };

    var undoBtn = document.getElementById('undo');
    if (undoBtn) undoBtn.onclick = function () {
      if (!st.H.length) return;
      st.S = J.normalize(JSON.parse(st.H.pop())) || st.S;
      if (st.sel != null && st.sel >= st.S.els.length) st.sel = null;
      J.save(); render(); msg('Ação desfeita.');
    };

    var rmBtn = document.getElementById('rmimg');
    if (rmBtn) rmBtn.onclick = function () {
      if (st.sel == null) return;
      commit(function () { st.S.els[st.sel].img = ''; }, 'Imagem removida.');
    };

    var eiInput = document.getElementById('ei');
    if (eiInput) eiInput.onchange = function () {
      var file = this.files[0], i = st.sel; this.value = '';
      if (!file || i == null) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { msg('Use PNG, JPEG ou WebP.'); return; }
      if (file.size > 1500000) { msg('Imagem grande demais. Use um arquivo de até 1,5 MB.'); return; }
      var r = new FileReader();
      r.onload = function () {
        if (st.S.els[i]) commit(function () { st.S.els[i].img = String(r.result); }, 'Imagem adicionada.', true);
      };
      r.onerror = function () { msg('Não foi possível ler o arquivo.'); };
      r.readAsDataURL(file);
    };

    function view(m) {
      var frame = document.getElementById('frame');
      if (frame) frame.classList.toggle('m', m);
      var vd = document.getElementById('vd');
      var vm = document.getElementById('vm');
      if (vd) vd.setAttribute('aria-pressed', !m);
      if (vm) vm.setAttribute('aria-pressed', m);
    }
    var vdBtn = document.getElementById('vd'); if (vdBtn) vdBtn.onclick = function () { view(false); };
    var vmBtn = document.getElementById('vm'); if (vmBtn) vmBtn.onclick = function () { view(true); };

    var pg = document.getElementById('page');
    if (pg) {
      pg.addEventListener('dragstart', function (e) {
        var el = e.target.closest('.el');
        if (el) { st.drag = +el.dataset.i; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'x'); }
      });
      pg.addEventListener('dragover', function (e) { if (st.drag != null) e.preventDefault(); });
      pg.addEventListener('drop', function (e) {
        var el = e.target.closest('.el');
        if (el && st.drag != null) {
          e.preventDefault();
          var to = +el.dataset.i, from = st.drag; st.drag = null;
          if (to !== from) commit(function () {
            var m = st.S.els.splice(from, 1)[0];
            st.S.els.splice(to, 0, m);
            st.sel = to;
          }, 'Elemento movido.', true);
        }
      });
      pg.addEventListener('dragend', function () { st.drag = null; });
    }
  }

  function boot() {
    var st = J.state;
    if (!st.S) st.S = J.load() || J.fromT('branco');
    st.sel = null;
    if (!st.studioBound) {
      st.studioBound = true;
      bindStudioHandlers();
    }
    render();
  }

  J.studio = { boot: boot, render: render };
})(window.JEITO);