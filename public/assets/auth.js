/* ============================================================
   MetLife Brasil — Auth Module (client-side simples)
   ------------------------------------------------------------
   ⚠️  Este módulo NÃO é seguro. É um controle de acesso visual,
   não uma camada de segurança real. As senhas estão em texto
   puro no source e qualquer pessoa com DevTools pode bypassar.
   Para uso interno apenas.

   2 perfis com 2 senhas:
   - 'metlife2026' → role 'metlife' (apenas comenta e aprova)
   - 'molla2026'   → role 'molla'   (administração: criar/editar/excluir)
   ============================================================ */

(function () {
  'use strict';

  // 🔑 Senhas → roles. Edite aqui se precisar trocar.
  const PASSWORDS = {
    'metlife2026': 'metlife',
    'molla2026': 'molla'
  };

  // Chaves do storage
  const KEY_AUTH = 'metlife_auth';
  const KEY_USER = 'metlife_user';
  const KEY_ROLE = 'metlife_role';

  // Páginas que NÃO exigem autenticação
  const PUBLIC_PAGES = ['/login', '/login.html'];

  const Auth = {
    /**
     * Tenta logar com a senha informada.
     * @param {string} password
     * @param {string} [userName] - opcional; se vier, salva como nome do usuário desta sessão
     * @returns {boolean}
     */
    login(password, userName) {
      const role = PASSWORDS[password];
      if (!role) return false;
      sessionStorage.setItem(KEY_AUTH, '1');
      sessionStorage.setItem(KEY_ROLE, role);
      const cleanName = (userName || '').trim();
      if (cleanName) {
        sessionStorage.setItem(KEY_USER, cleanName);
      }
      return true;
    },

    /** Logout: limpa tudo e volta para o login. */
    logout() {
      sessionStorage.removeItem(KEY_AUTH);
      sessionStorage.removeItem(KEY_ROLE);
      sessionStorage.removeItem(KEY_USER);
      window.location.href = '/login';
    },

    /** Está autenticado? */
    isAuthenticated() {
      return sessionStorage.getItem(KEY_AUTH) === '1';
    },

    /** Retorna o role atual ('metlife' ou 'molla'). */
    getRole() {
      return sessionStorage.getItem(KEY_ROLE) || 'metlife';
    },

    /** Conveniência: o usuário tem permissão de administração? */
    isAdmin() {
      return this.getRole() === 'molla';
    },

    /**
     * Nome do usuário atual.
     * Lê de sessionStorage primeiro; legacy fallback de localStorage
     * para usuários que tinham nome salvo em versões anteriores.
     */
    getUserName() {
      const fromSession = sessionStorage.getItem(KEY_USER);
      if (fromSession) return fromSession;
      // Legacy: nome salvo em localStorage em versões anteriores
      const fromLocal = localStorage.getItem(KEY_USER);
      return fromLocal || '';
    },

    /** Define o nome do usuário (na sessão). */
    setUserName(name) {
      const clean = (name || '').trim();
      if (clean) sessionStorage.setItem(KEY_USER, clean);
    },

    /**
     * Garante que existe um nome de usuário. Defensivo apenas:
     * normalmente o nome vem do login. Se faltar, pergunta via prompt.
     */
    ensureUserName() {
      let name = this.getUserName();
      if (!name) {
        name = prompt('Como você quer ser identificado? (seu nome aparecerá nos comentários e aprovações)');
        if (name && name.trim()) {
          this.setUserName(name);
          return name.trim();
        }
        return '';
      }
      return name;
    },

    /** Guarda em uma página protegida — redireciona se não autenticado. */
    guard() {
      const path = window.location.pathname;
      const isPublic = PUBLIC_PAGES.some(p => path === p || path === p + '/');
      if (isPublic) return;

      if (!this.isAuthenticated()) {
        window.location.replace('/login');
      }
    },
  };

  // Expor globalmente
  window.MetLifeAuth = Auth;

  // Auto-guard: roda imediatamente em qualquer página que importar este script.
  Auth.guard();
})();
