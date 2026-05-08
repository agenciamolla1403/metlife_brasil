/* ============================================================
   MetLife Brasil — Header Global (injeção via JS)
   ------------------------------------------------------------
   Detecta a rota atual e marca o link ativo automaticamente.
   Botão Sair conectado ao MetLifeAuth.logout().
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
  };

  function activeRouteFromPath() {
    const p = window.location.pathname.replace(/\/$/, '') || '/';
    return ROUTE_MAP[p] || 'home';
  }

  function buildHtml(activeId) {
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

    return `
      <div class="mlh-inner">
        <a class="mlh-logo" href="/" aria-label="Central do Cliente">
          <img src="/img/logo_metlife.svg" alt="MetLife" />
        </a>
        <nav class="mlh-nav" aria-label="Navegação principal">
          <a href="/" class="${isActive('home')}">Central</a>
          <a href="/cronograma" class="${isActive('cronograma')}">Cronograma</a>
          <a href="/plano-midia" class="${isActive('plano')}">Plano de Mídia</a>
          <a href="/aprovacao" class="${isActive('aprovacao')}">Aprovação</a>
        </nav>
        <div class="mlh-actions">
          ${userChip}
          ${roleChip}
          <button class="mlh-btn-logout" id="mlhLogoutBtn" type="button">Sair</button>
        </div>
      </div>
    `;
  }

  function escapeAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function inject() {
    // Não duplicar se já existir
    if (document.querySelector('.mlh-header')) return;

    // Usamos <div role="banner"> em vez de <header> de propósito:
    // alguns HTMLs do projeto usam seletor CSS genérico `header { ... }`
    // que vazaria estilos do hero pro nosso componente.
    const wrapper = document.createElement('div');
    wrapper.className = 'mlh-header';
    wrapper.setAttribute('role', 'banner');
    wrapper.innerHTML = buildHtml(activeRouteFromPath());

    // Insere como primeiro elemento do body
    document.body.insertBefore(wrapper, document.body.firstChild);

    const btn = document.getElementById('mlhLogoutBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (confirm('Deseja sair?') && window.MetLifeAuth) {
          window.MetLifeAuth.logout();
        }
      });
    }

    // Expõe a altura real do header como CSS var global pra elementos
    // sticky de cada página se ajustarem automaticamente.
    function updateHeaderHeight() {
      const h = wrapper.offsetHeight || 60;
      document.documentElement.style.setProperty('--mlh-header-h', h + 'px');
    }
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    // Reaplica quando carregam fontes/imagens (logo SVG pode mudar altura)
    window.addEventListener('load', updateHeaderHeight);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
