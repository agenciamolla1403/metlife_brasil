/* ============================================================
   Arquivos & Downloads — Render + filtros + busca + CRUD admin
   ============================================================ */
(function () {
  'use strict';

  if (!window.FilesStore) {
    console.error('[arquivos] FilesStore não carregado.');
    return;
  }

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
  const escapeAttr = escapeHtml;

  const fmtData = (iso) => {
    if (!iso) return '';
    try {
      const [y, m, d] = String(iso).split('T')[0].split('-');
      return `${d}/${m}/${y}`;
    } catch { return iso; }
  };

  const isAdmin = () => !!(window.MetLifeAuth && window.MetLifeAuth.isAdmin && window.MetLifeAuth.isAdmin());

  // ============ TOAST ============
  const Toast = {
    show(msg, kind = 'info') {
      let el = document.getElementById('aqToast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'aqToast';
        el.className = 'aq-toast';
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.className = 'aq-toast aq-toast-' + kind + ' is-visible';
      clearTimeout(this._t);
      this._t = setTimeout(() => { el.className = 'aq-toast aq-toast-' + kind; }, 2600);
    }
  };

  // ============ STATE ============
  let state = {
    tipo: 'todos',
    busca: '',
    arquivos: [],
    loading: true,
    error: null,
  };

  // ============ MODAL DE EDIÇÃO ============
  const Modal = {
    open(arquivo) {
      const isEdit = !!arquivo;
      const a = arquivo || { nome: '', tipo: 'pdf', descricao: '', url: '', data: '' };
      const dataStr = a.data ? String(a.data).split('T')[0] : '';

      const tipoOpts = ORDEM.map(t =>
        `<option value="${t}" ${a.tipo === t ? 'selected' : ''}>${TIPOS[t].icon} ${TIPOS[t].label}</option>`
      ).join('');

      const html = `
        <div class="aq-modal-backdrop" id="aqModalBackdrop">
          <div class="aq-modal" role="dialog" aria-modal="true" aria-labelledby="aqModalTitle">
            <div class="aq-modal-head">
              <h3 id="aqModalTitle">${isEdit ? 'Editar arquivo' : 'Adicionar arquivo'}</h3>
              <button type="button" class="aq-modal-close" id="aqModalClose" aria-label="Fechar">×</button>
            </div>
            <form class="aq-modal-body" id="aqModalForm">
              <label>
                <span>Nome do arquivo *</span>
                <input type="text" name="nome" required maxlength="200" value="${escapeAttr(a.nome)}" placeholder="Ex: KV Principal — É tempo de Copa" />
              </label>
              <label>
                <span>Tipo *</span>
                <select name="tipo" required>${tipoOpts}</select>
              </label>
              <label>
                <span>URL do SharePoint *</span>
                <input type="url" name="url" required value="${escapeAttr(a.url)}" placeholder="https://sharepoint.com/sites/..." />
              </label>
              <label>
                <span>Descrição</span>
                <textarea name="descricao" rows="3" maxlength="500" placeholder="Linha curta de contexto sobre o arquivo">${escapeHtml(a.descricao || '')}</textarea>
              </label>
              <label>
                <span>Data (opcional)</span>
                <input type="date" name="data" value="${escapeAttr(dataStr)}" />
              </label>
              <div class="aq-modal-actions">
                ${isEdit ? `<button type="button" class="aq-btn-danger" id="aqModalDelete">Excluir</button>` : ''}
                <div class="aq-modal-actions-right">
                  <button type="button" class="aq-btn-ghost" id="aqModalCancel">Cancelar</button>
                  <button type="submit" class="aq-btn-primary">${isEdit ? 'Salvar' : 'Adicionar'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      `;
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      document.body.appendChild(wrap.firstElementChild);
      this._wireUp(arquivo);
    },

    _wireUp(arquivo) {
      const backdrop = document.getElementById('aqModalBackdrop');
      const form = document.getElementById('aqModalForm');
      const escListener = (e) => { if (e.key === 'Escape') close(); };
      const close = () => { backdrop.remove(); document.removeEventListener('keydown', escListener); };

      document.addEventListener('keydown', escListener);
      document.getElementById('aqModalClose').addEventListener('click', close);
      document.getElementById('aqModalCancel').addEventListener('click', close);
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

      if (arquivo) {
        document.getElementById('aqModalDelete').addEventListener('click', async () => {
          if (!confirm('Excluir este arquivo? Essa ação não pode ser desfeita.')) return;
          try {
            await window.FilesStore.delete(arquivo.id);
            Toast.show('Arquivo excluído.', 'success');
            close();
            await reload();
          } catch (e) {
            Toast.show('Erro ao excluir: ' + (e.message || e), 'error');
          }
        });
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const payload = {
          nome: fd.get('nome'),
          tipo: fd.get('tipo'),
          url: fd.get('url'),
          descricao: fd.get('descricao'),
          data: fd.get('data') || null,
        };
        try {
          if (arquivo) {
            await window.FilesStore.update(arquivo.id, payload);
            Toast.show('Arquivo atualizado.', 'success');
          } else {
            await window.FilesStore.create(payload);
            Toast.show('Arquivo adicionado.', 'success');
          }
          close();
          await reload();
        } catch (err) {
          Toast.show('Erro: ' + (err.message || err), 'error');
        }
      });

      // Foco no primeiro campo
      setTimeout(() => form.querySelector('input[name="nome"]').focus(), 50);
    },
  };

  // ============ RENDER ============
  function renderFiltros() {
    const arr = state.arquivos || [];
    const counts = { todos: arr.length };
    ORDEM.forEach(t => { counts[t] = arr.filter(a => a.tipo === t).length; });

    const chips = [
      `<button type="button" class="aq-chip ${state.tipo === 'todos' ? 'is-active' : ''}" data-tipo="todos">
         <span>Todos</span>
         <span class="aq-chip-count">${counts.todos}</span>
       </button>`,
      ...ORDEM.map(t => {
        const meta = TIPOS[t];
        const active = state.tipo === t ? 'is-active' : '';
        return `<button type="button" class="aq-chip ${active}" data-tipo="${t}">
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

  function renderAdminBar() {
    const slot = document.getElementById('aqAdminSlot');
    if (!slot) return;
    if (isAdmin()) {
      slot.innerHTML = `<button type="button" class="aq-btn-primary aq-btn-add" id="aqBtnAdd">+ Adicionar arquivo</button>`;
      document.getElementById('aqBtnAdd').addEventListener('click', () => Modal.open(null));
    } else {
      slot.innerHTML = '';
    }
  }

  function renderLista() {
    const lista = document.getElementById('aqList');
    const count = document.getElementById('aqCount');

    if (state.loading) {
      lista.innerHTML = `<div class="aq-empty"><strong>Carregando arquivos…</strong>Aguarde um instante.</div>`;
      count.textContent = '';
      return;
    }
    if (state.error) {
      lista.innerHTML = `
        <div class="aq-empty">
          <strong>Não foi possível carregar os arquivos.</strong>
          ${escapeHtml(state.error)}
          <br><br>
          <button type="button" class="aq-btn-ghost" id="aqRetry">Tentar de novo</button>
        </div>`;
      count.textContent = '';
      const r = document.getElementById('aqRetry');
      if (r) r.addEventListener('click', reload);
      return;
    }

    const q = (state.busca || '').toLowerCase().trim();
    const filtered = (state.arquivos || []).filter(a => {
      if (state.tipo !== 'todos' && a.tipo !== state.tipo) return false;
      if (q) {
        const hay = ((a.nome || '') + ' ' + (a.descricao || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    count.textContent = `${filtered.length} arquivo${filtered.length === 1 ? '' : 's'}`;

    if (!filtered.length) {
      const totalHas = (state.arquivos || []).length;
      lista.innerHTML = `
        <div class="aq-empty">
          <strong>${totalHas === 0 ? 'Nenhum arquivo cadastrado ainda.' : 'Nenhum arquivo encontrado.'}</strong>
          ${totalHas === 0 && isAdmin() ? 'Clique em <strong>+ Adicionar arquivo</strong> pra começar.' : 'Tenta ajustar os filtros ou a busca.'}
        </div>`;
      return;
    }

    const admin = isAdmin();
    lista.innerHTML = filtered.map(a => {
      const meta = TIPOS[a.tipo] || TIPOS.pdf;
      return `
        <article class="aq-card" style="--aq-card-color: ${meta.cor}; --aq-card-bg: ${meta.bg};" data-id="${escapeAttr(a.id)}">
          ${admin ? `<button type="button" class="aq-card-edit" data-action="edit" title="Editar arquivo">✏️</button>` : ''}
          <div class="aq-card-head">
            <div class="aq-card-icon">${meta.icon}</div>
            <div class="aq-card-meta">
              <span class="aq-card-tipo">${escapeHtml(meta.label)}</span>
              <h3 class="aq-card-nome">${escapeHtml(a.nome)}</h3>
            </div>
          </div>
          ${a.descricao ? `<p class="aq-card-desc">${escapeHtml(a.descricao)}</p>` : ''}
          <div class="aq-card-foot">
            <span class="aq-card-data">${a.data ? fmtData(a.data) : '—'}</span>
            <a class="aq-card-link" href="${escapeAttr(a.url)}" target="_blank" rel="noopener">
              Abrir <span aria-hidden="true">→</span>
            </a>
          </div>
        </article>
      `;
    }).join('');

    // Wire edit buttons
    if (admin) {
      lista.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const card = btn.closest('.aq-card');
          const id = card && card.dataset.id;
          const arquivo = state.arquivos.find(x => x.id === id);
          if (arquivo) Modal.open(arquivo);
        });
      });
    }
  }

  // ============ DATA LOAD ============
  async function reload() {
    state.loading = true;
    state.error = null;
    renderLista();
    try {
      state.arquivos = await window.FilesStore.list(true);
      state.loading = false;
    } catch (e) {
      state.loading = false;
      state.error = e.message || String(e);
    }
    renderFiltros();
    renderLista();
  }

  // ============ INIT ============
  async function init() {
    renderAdminBar();

    const search = document.getElementById('aqSearch');
    search.addEventListener('input', () => {
      state.busca = search.value;
      renderLista();
    });

    // Healthcheck
    try {
      await window.FilesStore.ping();
    } catch (e) {
      state.loading = false;
      state.error = 'Tabela `files` não encontrada no Supabase. Aplique o schema SQL primeiro.';
      renderLista();
      return;
    }

    await reload();

    // Realtime
    window.FilesStore.subscribe(() => {
      reload();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
