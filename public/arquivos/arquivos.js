/* ============================================================
   Arquivos & Downloads — Render + filtros + busca
   ============================================================ */
(function () {
  'use strict';

  if (!window.ARQUIVOS_DATA) {
    console.error('[arquivos] Dados não carregados.');
    return;
  }
  const D = window.ARQUIVOS_DATA;

  // ============ TIPOS ============
  const TIPOS = {
    ppt:      { label: 'Apresentação', plural: 'Apresentações', icon: '📊', cor: 'var(--aq-c-ppt)', bg: 'var(--aq-c-ppt-bg)' },
    pdf:      { label: 'PDF',          plural: 'PDFs',          icon: '📄', cor: 'var(--aq-c-pdf)', bg: 'var(--aq-c-pdf-bg)' },
    imagem:   { label: 'Imagem',       plural: 'Imagens',       icon: '🖼️', cor: 'var(--aq-c-img)', bg: 'var(--aq-c-img-bg)' },
    planilha: { label: 'Planilha',     plural: 'Planilhas',     icon: '📈', cor: 'var(--aq-c-xls)', bg: 'var(--aq-c-xls-bg)' },
    kv:       { label: 'Key Visual',   plural: 'Key Visuals',   icon: '🎨', cor: 'var(--aq-c-kv)',  bg: 'var(--aq-c-kv-bg)'  },
    video:    { label: 'Vídeo',        plural: 'Vídeos',        icon: '🎬', cor: 'var(--aq-c-vid)', bg: 'var(--aq-c-vid-bg)' },
  };
  const ORDEM = ['ppt', 'pdf', 'imagem', 'planilha', 'kv', 'video'];

  // ============ HELPERS ============
  const escapeHtml = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const fmtData = (iso) => {
    if (!iso) return '';
    try {
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    } catch { return iso; }
  };

  // ============ STATE ============
  let state = { tipo: 'todos', busca: '' };

  // ============ RENDER ============
  function renderFiltros() {
    const counts = { todos: D.arquivos.length };
    ORDEM.forEach(t => { counts[t] = D.arquivos.filter(a => a.tipo === t).length; });

    const chips = [
      `<button type="button" class="aq-chip ${state.tipo === 'todos' ? 'is-active' : ''}" data-tipo="todos">
         <span>Todos</span>
         <span class="aq-chip-count">${counts.todos}</span>
       </button>`,
      ...ORDEM.map(t => {
        const meta = TIPOS[t];
        const active = state.tipo === t ? 'is-active' : '';
        const disabled = counts[t] === 0 ? 'aq-chip-disabled' : '';
        return `<button type="button" class="aq-chip ${active} ${disabled}" data-tipo="${t}">
                  <span class="aq-chip-icon">${meta.icon}</span>
                  <span>${meta.plural}</span>
                  <span class="aq-chip-count">${counts[t]}</span>
                </button>`;
      }),
    ].join('');

    document.getElementById('aqFilters').innerHTML = chips;
    document.querySelectorAll('#aqFilters .aq-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        state.tipo = btn.dataset.tipo;
        renderFiltros();
        renderLista();
      });
    });
  }

  function renderLista() {
    const q = (state.busca || '').toLowerCase().trim();
    const filtered = D.arquivos.filter(a => {
      if (state.tipo !== 'todos' && a.tipo !== state.tipo) return false;
      if (q) {
        const hay = ((a.nome || '') + ' ' + (a.descricao || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const count = document.getElementById('aqCount');
    count.textContent = `${filtered.length} arquivo${filtered.length === 1 ? '' : 's'}`;

    const lista = document.getElementById('aqList');
    if (!filtered.length) {
      lista.innerHTML = `
        <div class="aq-empty">
          <strong>Nenhum arquivo encontrado.</strong>
          Tenta ajustar os filtros ou a busca.
        </div>`;
      return;
    }

    lista.innerHTML = filtered.map(a => {
      const meta = TIPOS[a.tipo] || TIPOS.pdf;
      return `
        <article class="aq-card" style="--aq-card-color: ${meta.cor}; --aq-card-bg: ${meta.bg};">
          <div class="aq-card-head">
            <div class="aq-card-icon">${meta.icon}</div>
            <div class="aq-card-meta">
              <span class="aq-card-tipo">${escapeHtml(meta.label)}</span>
              <h3 class="aq-card-nome">${escapeHtml(a.nome)}</h3>
            </div>
          </div>
          <p class="aq-card-desc">${escapeHtml(a.descricao || '')}</p>
          <div class="aq-card-foot">
            <span class="aq-card-data">${fmtData(a.data)}</span>
            <a class="aq-card-link" href="${escapeHtml(a.url)}" target="_blank" rel="noopener">
              Abrir <span aria-hidden="true">→</span>
            </a>
          </div>
        </article>
      `;
    }).join('');
  }

  // ============ INIT ============
  function init() {
    renderFiltros();

    const search = document.getElementById('aqSearch');
    search.addEventListener('input', () => {
      state.busca = search.value;
      renderLista();
    });

    renderLista();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
