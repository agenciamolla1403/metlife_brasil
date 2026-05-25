/* ============================================================
   MetLife Brasil — Header Global (injeção via JS)
   ------------------------------------------------------------
   Detecta a rota atual e marca o link/grupo ativo automaticamente.
   Em mobile, transforma a navegação em hamburguer + drawer
   lateral esquerdo com accordions pros grupos.

   S47 — Reestruturação em 5 itens (com 2 dropdowns):
     • Jornada (top-level)
     • Mídia ▾ (Plano · Crono Ads · Performance · Elemidia)
     • Operação ▾ (Blitz · Muito Além do Jogo)
     • Aprovação (top-level)
     • Arquivos (top-level)
   ============================================================ */

(function () {
  'use strict';

  // Mapa de rotas → identificador de link ativo (usado pra marcar
  // tanto o grupo dropdown quanto o item filho dentro dele)
  const ROUTE_MAP = {
    '/': 'home',
    '/index.html': 'home',
    '/cronograma': 'cronograma',
    '/cronograma.html': 'cronograma',
    '/plano-midia': 'plano',
    '/plano-midia.html': 'plano',
    '/performance': 'performance',
    '/performance.html': 'performance',
    '/aprovacao': 'aprovacao',
    '/aprovacao.html': 'aprovacao',
    '/elemidia': 'elemidia',
    '/elemidia.html': 'elemidia',
    '/blitz': 'blitz',
    '/blitz.html': 'blitz',
    '/muito-alem-do-jogo': 'muito-alem',
    '/muito-alem-do-jogo.html': 'muito-alem',
    '/arquivos': 'arquivos',
    '/arquivos.html': 'arquivos',
    '/jornada': 'jornada',
    '/jornada.html': 'jornada',
    '/ajuda': 'ajuda',
    '/ajuda.html': 'ajuda',
  };

  // Definição centralizada dos itens de navegação.
  // Itens com children renderizam como dropdown (desktop) / accordion (mobile).
  const NAV_ITEMS = [
    {
      id: 'jornada',
      href: '/jornada',
      label: 'Jornada'
    },
    {
      id: 'group-midia',
      label: 'Mídia',
      children: [
        { id: 'plano',       href: '/plano-midia', label: 'Plano',       hint: 'Estratégia e proposta' },
        { id: 'cronograma',  href: '/cronograma',  label: 'Crono Ads',   hint: 'Dia a dia da campanha' },
        { id: 'performance', href: '/performance', label: 'Performance', hint: 'Resultados semana a semana' },
        { id: 'elemidia',    href: '/elemidia',    label: 'Elemidia',    hint: 'Mídia em prédios' },
      ]
    },
    {
      id: 'group-operacao',
      label: 'Operação',
      children: [
        { id: 'blitz',       href: '/blitz',                 label: 'Blitz',                hint: 'Ativações em jogos da Copa' },
        { id: 'muito-alem',  href: '/muito-alem-do-jogo',    label: 'Muito Além do Jogo',   hint: 'Programa institucional' },
      ]
    },
    {
      id: 'aprovacao',
      href: '/aprovacao',
      label: 'Aprovação'
    },
    {
      id: 'arquivos',
      href: '/arquivos',
      label: 'Arquivos'
    },
  ];

  function activeRouteFromPath() {
    const p = window.location.pathname.replace(/\/$/, '') || '/';
    return ROUTE_MAP[p] || 'home';
  }

  /**
   * Retorna o id do grupo dropdown ativo (se algum filho casar com a rota atual),
   * ou null se a rota corresponde a um item top-level (sem dropdown).
   */
  function activeGroupId(activeId) {
    for (const it of NAV_ITEMS) {
      if (it.children) {
        for (const child of it.children) {
          if (child.id === activeId) return it.id;
        }
      }
    }
    return null;
  }

  function buildHeaderHtml(activeId) {
    const isActive = (id) => id === activeId ? 'active' : '';
    const activeGroup = activeGroupId(activeId);
    const isAdmin = !!(window.MetLifeAuth && window.MetLifeAuth.isAdmin && window.MetLifeAuth.isAdmin());
    const userName = (window.MetLifeAuth && window.MetLifeAuth.getUserName) ? (window.MetLifeAuth.getUserName() || '') : '';
    const initials = userName ? userName.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase() : '';
    const userChip = userName
      ? `<span class="mlh-user-chip" title="${escapeAttr(userName)}"><span class="mlh-user-avatar">${escapeAttr(initials)}</span><span class="mlh-user-name">${escapeAttr(userName)}</span></span>`
      : '';
    const roleChip = isAdmin
      ? '<span class="mlh-role-chip mlh-role-admin" title="Perfil Molla — administra campanhas e peças">Admin</span>'
      : '';

    const navLinks = NAV_ITEMS.map((it) => {
      if (it.children) {
        const isGroupActive = activeGroup === it.id;
        const childLinks = it.children.map(c => `
          <a href="${c.href}" class="mlh-dropdown-item ${isActive(c.id)}" data-nav-id="${c.id}">
            <span class="mlh-dropdown-label">${c.label}</span>
            ${c.hint ? `<span class="mlh-dropdown-hint">${c.hint}</span>` : ''}
          </a>
        `).join('');
        return `
          <div class="mlh-dropdown" data-group-id="${it.id}">
            <button type="button"
                    class="mlh-dropdown-trigger ${isGroupActive ? 'active' : ''}"
                    aria-haspopup="true"
                    aria-expanded="false"
                    data-group-id="${it.id}">
              ${it.label}<span class="mlh-caret" aria-hidden="true">▾</span>
            </button>
            <div class="mlh-dropdown-panel" role="menu" aria-label="${it.label}">
              ${childLinks}
            </div>
          </div>`;
      }
      return `<a href="${it.href}" class="${isActive(it.id)}" data-nav-id="${it.id}">${it.label}</a>`;
    }).join('\n          ');

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
   */
  function buildDrawerHtml(activeId) {
    const isActive = (id) => id === activeId ? 'active' : '';
    const activeGroup = activeGroupId(activeId);
    const isAdmin = !!(window.MetLifeAuth && window.MetLifeAuth.isAdmin && window.MetLifeAuth.isAdmin());
    const userName = (window.MetLifeAuth && window.MetLifeAuth.getUserName) ? (window.MetLifeAuth.getUserName() || '') : '';
    const initials = userName ? userName.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase() : '';

    const drawerLinks = NAV_ITEMS.map((it) => {
      if (it.children) {
        const isGroupActive = activeGroup === it.id;
        // Accordion: abre por padrão se um filho está ativo
        const expanded = isGroupActive ? 'true' : 'false';
        const openClass = isGroupActive ? 'is-open' : '';
        const childLinks = it.children.map(c => `
          <a href="${c.href}" class="mlh-drawer-sublink ${isActive(c.id)}" data-nav-id="${c.id}">${c.label}</a>
        `).join('');
        return `
          <div class="mlh-drawer-group ${openClass}" data-group-id="${it.id}">
            <button type="button"
                    class="mlh-drawer-group-trigger ${isGroupActive ? 'active' : ''}"
                    aria-expanded="${expanded}"
                    data-group-id="${it.id}">
              <span>${it.label}</span>
              <span class="mlh-drawer-caret" aria-hidden="true">▾</span>
            </button>
            <div class="mlh-drawer-sub" role="group" aria-label="${it.label}">
              ${childLinks}
            </div>
          </div>`;
      }
      return `<a href="${it.href}" class="mlh-drawer-link ${isActive(it.id)}" data-nav-id="${it.id}">${it.label}</a>`;
    }).join('\n          ');

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

  /**
   * Wiring dos dropdowns desktop:
   *   - Hover/focus abre, mouseleave fecha
   *   - Click no trigger faz toggle (útil pra teclado / tap em tablet)
   *   - ESC fecha o aberto
   *   - Click fora fecha
   */
  function wireDesktopDropdowns(headerEl) {
    const triggers = headerEl.querySelectorAll('.mlh-dropdown-trigger');
    const closeAll = () => {
      headerEl.querySelectorAll('.mlh-dropdown.is-open').forEach(d => {
        d.classList.remove('is-open');
        const t = d.querySelector('.mlh-dropdown-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    };

    triggers.forEach(trigger => {
      const dropdown = trigger.closest('.mlh-dropdown');
      if (!dropdown) return;

      // Hover (desktop): abre/fecha automaticamente via :hover no CSS.
      // Aqui só garantimos foco/teclado/click.
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = dropdown.classList.contains('is-open');
        closeAll();
        if (!isOpen) {
          dropdown.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      // Mouseleave fecha o dropdown (delay leve pra dar tempo de mover pro panel)
      let leaveTid = null;
      dropdown.addEventListener('mouseleave', () => {
        clearTimeout(leaveTid);
        leaveTid = setTimeout(() => {
          dropdown.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        }, 180);
      });
      dropdown.addEventListener('mouseenter', () => clearTimeout(leaveTid));
    });

    // ESC fecha qualquer dropdown
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });

    // Click fora fecha
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.mlh-dropdown')) closeAll();
    });
  }

  /**
   * Wiring dos accordions do drawer mobile:
   *   - Click no trigger expande/colapsa
   *   - Estado aria-expanded é mantido em sincronia
   */
  function wireDrawerAccordions(drawerWrap) {
    const triggers = drawerWrap.querySelectorAll('.mlh-drawer-group-trigger');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const group = trigger.closest('.mlh-drawer-group');
        if (!group) return;
        const isOpen = group.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });
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
      else if (mq.addListener) mq.addListener(handler);
    }

    // Wire dropdowns desktop + accordions drawer
    wireDesktopDropdowns(wrapper);
    wireDrawerAccordions(drawerWrap);

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
