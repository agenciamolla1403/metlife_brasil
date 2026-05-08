/* ============================================================
   MetLife Brasil — Auth Module (client-side simples)
   ------------------------------------------------------------
   ⚠️  Este módulo NÃO é seguro. É um controle de acesso visual,
   não uma camada de segurança real. A senha está em texto puro
   no source e qualquer pessoa com DevTools pode bypassar.
   Para uso interno apenas.
   ============================================================ */

(function () {
  'use strict';

  // 🔑 SENHA DO PROJETO — troque aqui se quiser.
  const PASSWORD = 'metlife2026';

  // Chaves do storage
  const KEY_AUTH = 'metlife_auth';
  const KEY_USER = 'metlife_user';

  // Páginas que NÃO exigem autenticação
  const PUBLIC_PAGES = ['/login', '/login.html'];

  // ----------------------------------------------------------
  // API pública (window.MetLifeAuth)
  // ----------------------------------------------------------
  const Auth = {
    /** Tenta logar com a senha informada. Retorna true/false. */
    login(password) {
      if (password === PASSWORD) {
        sessionStorage.setItem(KEY_AUTH, '1');
        return true;
      }
      return false;
    },

    /** Logout: limpa tudo e volta para o login. */
    logout() {
      sessionStorage.removeItem(KEY_AUTH);
      // mantemos o nome do user pra próxima vez (UX)
      window.location.href = '/login';
    },

    /** Está autenticado? */
    isAuthenticated() {
      return sessionStorage.getItem(KEY_AUTH) === '1';
    },

    /** Nome do usuário atual (perguntado dentro do app). */
    getUserName() {
      return localStorage.getItem(KEY_USER) || '';
    },

    /** Define o nome do usuário. */
    setUserName(name) {
      const clean = (name || '').trim();
      if (clean) localStorage.setItem(KEY_USER, clean);
    },

    /**
     * Garante que existe um nome de usuário, perguntando via prompt
     * se ainda não houver. Retorna o nome.
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
