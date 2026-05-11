/* ============================================================
   Bottom Sheet — JS leve
   ------------------------------------------------------------
   Auto-wire via data attributes:
     <button data-bs-open="painelId">Filtrar</button>
     <button data-bs-close>Fechar</button>

   API global: window.MetLifeBottomSheet.open(id) / .close(id)
   ============================================================ */

(function () {
  'use strict';

  function open(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('is-open');
    document.body.classList.add('bs-open');
    panel.setAttribute('aria-hidden', 'false');
  }

  function close(panel) {
    if (!panel) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    // Só remove body class se não tem outro sheet aberto
    const stillOpen = document.querySelector('.bs-panel.is-open');
    if (!stillOpen) document.body.classList.remove('bs-open');
  }

  function closeAll() {
    document.querySelectorAll('.bs-panel.is-open').forEach(p => close(p));
  }

  // Wire global de cliques
  document.addEventListener('click', (e) => {
    // Trigger pra abrir
    const opener = e.target.closest('[data-bs-open]');
    if (opener) {
      e.preventDefault();
      open(opener.getAttribute('data-bs-open'));
      return;
    }
    // Botão de fechar dentro do panel
    const closer = e.target.closest('[data-bs-close]');
    if (closer) {
      e.preventDefault();
      const panel = closer.closest('.bs-panel');
      if (panel) close(panel);
      return;
    }
    // Clique no backdrop fecha tudo
    if (e.target === document.body && document.body.classList.contains('bs-open')) {
      closeAll();
    }
  });

  // Tocar fora do panel (no ::after backdrop) — detecta clique fora dos panels abertos
  document.addEventListener('touchstart', (e) => {
    if (!document.body.classList.contains('bs-open')) return;
    const openPanel = document.querySelector('.bs-panel.is-open');
    if (openPanel && !openPanel.contains(e.target) && !e.target.closest('[data-bs-open]')) {
      closeAll();
    }
  }, { passive: true });
  document.addEventListener('mousedown', (e) => {
    if (!document.body.classList.contains('bs-open')) return;
    const openPanel = document.querySelector('.bs-panel.is-open');
    if (openPanel && !openPanel.contains(e.target) && !e.target.closest('[data-bs-open]')) {
      closeAll();
    }
  });

  // ESC fecha
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  // API global
  window.MetLifeBottomSheet = {
    open: open,
    close: (id) => close(document.getElementById(id)),
    closeAll: closeAll,
  };
})();
