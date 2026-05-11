/* ============================================================
   MetLife Brasil — Header Global (injeção via JS)
   ------------------------------------------------------------
   Detecta a rota atual e marca o link ativo automaticamente.
   Em mobile, transforma a navegação em hamburguer + drawer
   lateral esquerdo.
   ============================================================ */

(function () {
  'use strict';

  // Mapa de rotas → identificador de link ativo
  const ROUTE_MAP = {
    '/': 'home',
    '/index.html': 'home',
    '/cronograma': 'cronograma',
    '/cronograma.html': 'cronograma',
    '/plano-midia': 'plano',
    '/plano-midia.html': 'plano',
    '/aprovacao': 'aprovacao',
    '/aprovacao.html': 'aprovacao',
    '/elemidia': 'elemidia',
    '/elemidia.html': 'elemidia',
    '/blitz': 'blitz',
    '/blitz.html': 'blitz',
    '/arquivos': 'arquivos',
    '/arquivos.html': 'arquivos',
    '/jornada': 'jornada',
    '/jornada.html': 'jornada',
    '/ajuda': 'ajuda',
    '/ajuda.html': 'ajuda',
  };

  // Definição centralizada dos itens de navegação (reusa entre desktop e drawer)
  const NAV_ITEMS = [
    { href: '/jornada',    id: 'jornada',    label: 'Jornada' },
    { href: '/plano-midia', id: 'plano',      label: 'Mídia' },
    { href: '/cronograma', id: 'cronograma', label: 'Crono Ads' },
    { href: '/elemidia',   id: 'elemidia',   label: 'Elemidia' },
    { href: '/blitz',      id: 'blitz',      label: 'Blitz' },
    { href: '/arquivos',   id: 'arquivos',   label: 'Arquivos' },
    { href: '/aprovacao',  id: 'aprovacao',  label: 'Aprovação' },
  ];

  function activeRouteFromPath() {
    const p = window.location.pathname.replace(/\/$/, '') || '/';
    return ROUTE_MAP[p] || 'home';
  }

  function buildHeaderHtml(activeId) {
    const isActive = (id) => id === activeId ? 'active' : '';
    const isAdmin = !!(window.MetLifeAuth && window.MetLifeAuth.isAdmin && window.MetLifeAuth.isAdmin());
    const userName = (window.MetLifeAuth && window.MetLifeAuth.getUserName) ? (window.MetLifeAuth.getUserName() || '') : '';
    const initials = userName ? userName.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase() : '';
    const userChip = userName
      ? `<span class="mlh-user-chip" title="${escapeAttr(userName)}"><span class="mlh-user-avatar">${escapeAttr(initials)}</span><span class="mlh-user-name">${escapeAttr(userName)}</span></span>`
      : '';
    const roleChip = isAdmin
      ? '<span class="mlh-role-chip mlh-role-admin" title="Perfil Molla — administra campanhas e peças">Admin</span>'
      : '';

    const navLinks = NAV_ITEMS.map(it =>
      `<a href="${it.href}" class="${isActive(it.id)}">${it.label}</a>`
    ).join('\n          ');

    return `
      <div class="mlh-inner">
        <button class="mlh-hamburger" id="mlhHamburgerBtn" type="button" aria-label="Abrir menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <a class="mlh-logo" href="/" aria-label="Central do Cliente">
          <img src="/img/logo_metlife.svg" alt="MetLife" />
        </a>
        <nav class="mlh-nav" aria-label="Navegação principal">
          ${navLinks}
        </nav>
        <div class="mlh-actions">
          ${userChip}
          ${roleChip}
          <a class="mlh-btn-help ${isActive('ajuda')}" href="/ajuda" title="Como usar a plataforma" aria-label="Ajuda">?</a>
          <button class="mlh-btn-logout" id="mlhLogoutBtn" type="button">Sair</button>
        </div>
      </div>
    `;
  }

  /**
   * Drawer é renderizado como SIBLING do .mlh-header (filho direto do body).
   * Motivo: o .mlh-header usa backdrop-filter, que cria contexto de stacking
   * em iOS Safari e PRENDE position:fixed filhos dentro dos limites do header
   * (~60px). Mantendo o drawer fora do header, ele se posiciona corretamente
   * em relação ao viewport.
   *
   * Também usamos <div> com role apropriado em vez de <aside>/<header>/<nav>
   * pra evitar conflito com seletores CSS genéricos das páginas (`header{}`,
   * `nav{}` etc).
   */
  function buildDrawerHtml(activeId) {
    const isActive = (id) => id === activeId ? 'active' : '';
    const isAdmin = !!(window.MetLifeAuth && window.MetLifeAuth.isAdmin && window.MetLifeAuth.isAdmin());
    const userName = (window.MetLifeAuth && window.MetLifeAuth.getUserName) ? (window.MetLifeAuth.getUserName() || '') : '';
    const initials = userName ? userName.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase() : '';

    const drawerLinks = NAV_ITEMS.map(it =>
      `<a href="${it.href}" class="mlh-drawer-link ${isActive(it.id)}">${it.label}</a>`
    ).join('\n          ');

    return `
      <div class="mlh-drawer-backdrop" id="mlhDrawerBackdrop" aria-hidden="true"></div>
      <div class="mlh-drawer" id="mlhDrawer" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden="true">
        <div class="mlh-drawer-head">
          <a class="mlh-drawer-logo" href="/" aria-label="Central do Cliente">
            <img src="/img/logo_metlife.svg" alt="MetLife" />
          </a>
          <button class="mlh-drawer-close" id="mlhDrawerClose" type="button" aria-label="Fechar menu">×</button>
        </div>
        ${userName ? `
          <div class="mlh-drawer-user">
            <span class="mlh-drawer-user-avatar">${escapeAttr(initials)}</span>
            <div class="mlh-drawer-user-info">
              <span class="mlh-drawer-user-name">${escapeAttr(userName)}</span>
              ${isAdmin ? '<span class="mlh-drawer-user-role">Admin · Molla</span>' : '<span class="mlh-drawer-user-role">MetLife</span>'}
            </div>
          </div>
        ` : ''}
        <div class="mlh-drawer-nav" role="navigation" aria-label="Navegação principal mobile">
          ${drawerLinks}
          <a href="/ajuda" class="mlh-drawer-link mlh-drawer-link-help ${isActive('ajuda')}"><span class="mlh-drawer-help-icon">?</span> Ajuda</a>
        </div>
        <div class="mlh-drawer-foot">
          <button class="mlh-drawer-logout" id="mlhDrawerLogoutBtn" type="button">Sair</button>
        </div>
      </div>
    `;
  }

  function escapeAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function openDrawer() {
    const drawer = document.getElementById('mlhDrawer');
    const backdrop = document.getElementById('mlhDrawerBackdrop');
    const hamburger = document.getElementById('mlhHamburgerBtn');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (backdrop) backdrop.classList.add('is-open');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('mlh-drawer-open');
  }

  function closeDrawer() {
    const drawer = document.getElementById('mlhDrawer');
    const backdrop = document.getElementById('mlhDrawerBackdrop');
    const hamburger = document.getElementById('mlhHamburgerBtn');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.classList.remove('is-open');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mlh-drawer-open');
  }

  function handleLogout() {
    if (confirm('Deseja sair?') && window.MetLifeAuth) {
      window.MetLifeAuth.logout();
    }
  }

  function inject() {
    if (document.querySelector('.mlh-header')) return;

    const activeId = activeRouteFromPath();

    // 1) Cria o header (sticky, com backdrop-filter)
    const wrapper = document.createElement('div');
    wrapper.className = 'mlh-header';
    wrapper.setAttribute('role', 'banner');
    wrapper.innerHTML = buildHeaderHtml(activeId);
    document.body.insertBefore(wrapper, document.body.firstChild);

    // 2) Cria o drawer como SIBLING do header (filho direto do body).
    //    Crucial pra Safari iOS: o backdrop-filter do .mlh-header cria
    //    contexto de stacking que prende position:fixed filhos dentro
    //    da altura do header (~60px). Drawer fora do header funciona
    //    em relação ao viewport como esperado.
    const drawerWrap = document.createElement('div');
    drawerWrap.className = 'mlh-drawer-root';
    drawerWrap.innerHTML = buildDrawerHtml(activeId);
    document.body.appendChild(drawerWrap);

    // Botões de logout (header e drawer)
    const logoutBtn = document.getElementById('mlhLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    const drawerLogoutBtn = document.getElementById('mlhDrawerLogoutBtn');
    if (drawerLogoutBtn) drawerLogoutBtn.addEventListener('click', handleLogout);

    // Hamburguer e fechar
    const hamburger = document.getElementById('mlhHamburgerBtn');
    const drawerClose = document.getElementById('mlhDrawerClose');
    const backdrop = document.getElementById('mlhDrawerBackdrop');
    if (hamburger) hamburger.addEventListener('click', openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    // ESC fecha drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
    });

    // Se sair do mobile pra desktop com drawer aberto, fecha automaticamente
    if (typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(min-width: 761px)');
      const handler = (ev) => { if (ev.matches) closeDrawer(); };
      if (mq.addEventListener) mq.addEventListener('change', handler);
      else if (mq.addListener) mq.addListener(handler); // Safari antigo
    }

    // Expõe altura real do header como CSS var (pra elementos sticky)
    function updateHeaderHeight() {
      const inner = wrapper.querySelector('.mlh-inner');
      const h = (inner ? inner.offsetHeight : wrapper.offsetHeight) || 60;
      document.documentElement.style.setProperty('--mlh-header-h', h + 'px');
    }
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('load', updateHeaderHeight);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
