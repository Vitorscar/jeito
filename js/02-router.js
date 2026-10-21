window.JEITO = window.JEITO || {};
(function (J) {
  'use strict';

  function currentView() {
    var h = location.hash;
    return h === '#studio' ? 'studio' : h === '#criar' ? 'criar' : 'site';
  }

  function route() {
    var view = currentView();
    var siteEl   = document.getElementById('site');
    var criarEl  = document.getElementById('criar');
    var studioEl = document.getElementById('studio');
    if (siteEl)   siteEl.hidden   = view !== 'site';
    if (criarEl)  criarEl.hidden  = view !== 'criar';
    if (studioEl) studioEl.hidden = view !== 'studio';

    if (view !== J.state.lastView) { window.scrollTo(0, 0); J.state.lastView = view; }

    var fab = document.querySelector('.fab');
    if (fab) fab.hidden = view !== 'site';

    if (view === 'studio' && !J.state.started) {
      J.state.started = true;
      J.studio.boot();
    }
    if (view === 'criar' && J.signup && J.signup.init) J.signup.init();
  }

  window.addEventListener('hashchange', route);

  J.router = {
    currentView: currentView,
    route: route,
    start: route
  };
})(window.JEITO);