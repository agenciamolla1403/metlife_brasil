/* ============================================================
   MetLife Brasil — Aprovação de Peças (SPA)
   ------------------------------------------------------------
   Persistência: Supabase (via window.MetLifeStore)
   Toda a camada de UI é async; loading states em cada operação.
   ============================================================ */

(function () {
  'use strict';

  if (!window.MetLifeStore) {
    document.addEventListener('DOMContentLoaded', () => {
      const c = document.getElementById('appContent');
      if (c) c.innerHTML = `
        <div class="empty-state">
          <div class="icon">⚠️</div>
          <h3>Erro ao carregar dados</h3>
          <p>Falha ao inicializar o Supabase. Verifique <code>config.js</code> e a conexão.</p>
        </div>`;
    });
    return;
  }

  const Store = window.MetLifeStore;

  // ============ CONSTANTES ============
  const MAX_IMAGE_DIM = 1400;
  const IMAGE_QUALITY = 0.82;
  const MAX_IMAGE_BYTES = 800 * 1024;

  const CAMPAIGN_TYPES = [
    'Awareness', 'Performance', 'Branding',
    'Lançamento', 'Sazonal', 'Always On',
    'Institucional', 'Promocional'
  ];

  // ============ UTILS ============
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hour}:${min}`;
  }

  function relativeTime(iso) {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return Math.floor(diff / 60) + 'min';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    return formatDate(iso);
  }

  function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          let quality = IMAGE_QUALITY;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while (dataUrl.length > MAX_IMAGE_BYTES * 1.37 && quality > 0.4) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Imagem inválida'));
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function toEmbedUrl(url) {
    if (!url) return null;
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?#/]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
    return null;
  }

  // ============ TOAST ============
  const Toast = {
    _t: null,
    show(msg, type = 'default', duration = 2800) {
      let el = document.getElementById('appToast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'appToast';
        el.className = 'toast';
        document.body.appendChild(el);
      }
      el.className = 'toast' + (type !== 'default' ? ' ' + type : '');
      el.textContent = msg;
      requestAnimationFrame(() => el.classList.add('show'));
      clearTimeout(this._t);
      this._t = setTimeout(() => el.classList.remove('show'), duration);
    }
  };

  // ============ LOADING / ERROR HELPERS ============
  function loadingHtml(msg = 'Carregando...') {
    return `
      <div class="empty-state">
        <div class="loader" style="
          width: 40px; height: 40px; margin: 0 auto 14px;
          border: 3px solid rgba(0,59,92,0.12);
          border-top-color: var(--blue);
          border-radius: 50%;
          animation: spin 800ms linear infinite;
        "></div>
        <p style="font-size:13px; color:var(--muted);">${escapeHtml(msg)}</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
  }

  function errorHtml(err, retryFn) {
    const id = 'retry_' + Math.random().toString(36).slice(2, 8);
    setTimeout(() => {
      const btn = document.getElementById(id);
      if (btn && retryFn) btn.addEventListener('click', retryFn);
    }, 0);
    return `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Erro ao carregar</h3>
        <p>${escapeHtml(err && err.message ? err.message : 'Falha de conexão com o Supabase.')}</p>
        ${retryFn ? `<button class="btn-primary" id="${id}">Tentar novamente</button>` : ''}
      </div>
    `;
  }

  function safeError(err) {
    console.error(err);
    const msg = (err && err.message) ? err.message : 'Erro de conexão';
    Toast.show(msg, 'error', 4000);
  }

  // ============ ROUTER ============
  const Router = {
    parse() {
      const h = window.location.hash || '#/';
      const m = h.match(/^#\/c\/([\w-]+)/);
      if (m) return { view: 'campaign', campaignId: m[1] };
      return { view: 'home' };
    },
    go(hash) { window.location.hash = hash; },
    onChange(cb) { window.addEventListener('hashchange', cb); }
  };

  // ============ APP ============
  const App = {
    el: { crumb: null, userChip: null, content: null },
    state: { campaignFilter: 'all' },

    async init() {
      window.MetLifeAuth.ensureUserName();
      this.el.crumb = document.getElementById('crumb');
      this.el.userChip = document.getElementById('userChip');
      this.el.content = document.getElementById('appContent');
      this.renderUserChip(window.MetLifeAuth.getUserName());

      Router.onChange(() => this.render());

      // Trocar identificação (botão local — Sair fica no header global)
      document.getElementById('btnChangeUser').addEventListener('click', () => {
        const n = prompt('Atualizar identificação:', window.MetLifeAuth.getUserName() || '');
        if (n && n.trim()) {
          window.MetLifeAuth.setUserName(n);
          this.renderUserChip(n);
          this.render();
          Toast.show('Identificação atualizada.', 'success');
        }
      });

      // Healthcheck inicial — útil pra avisar se schema não foi aplicado
      try {
        await Store.ping();
      } catch (e) {
        this.el.content.innerHTML = errorHtml(
          { message: 'Não foi possível conectar ao Supabase. Confirme se o schema SQL foi aplicado e se a URL/key estão corretas em config.js.' },
          () => location.reload()
        );
        return;
      }

      this.render();
    },

    renderUserChip(name) {
      if (!this.el.userChip) return;
      this.el.userChip.innerHTML = `
        <span class="avatar">${escapeHtml(initials(name))}</span>
        <span>${escapeHtml(name)}</span>
      `;
    },

    async render() {
      const route = Router.parse();
      if (route.view === 'campaign') {
        await this.renderCampaignView(route.campaignId);
      } else {
        await this.renderHomeView();
      }
    },

    // ----- HOME VIEW -----
    async renderHomeView() {
      this.el.crumb.innerHTML = '<a href="/">Hub</a> &nbsp;/&nbsp; <strong>Aprovação de Peças</strong>';
      this.el.content.innerHTML = loadingHtml('Carregando campanhas...');

      let campaigns;
      try {
        campaigns = await Store.loadCampaignsWithStats();
      } catch (e) {
        this.el.content.innerHTML = errorHtml(e, () => this.renderHomeView());
        return;
      }

      const html = `
        <div class="toolbar">
          <div class="toolbar-left">
            <span class="filter-pill active">
              Campanhas <span class="count">${campaigns.length}</span>
            </span>
          </div>
          ${window.MetLifeAuth.isAdmin() ? `
            <button class="btn-primary" id="btnNewCampaign">
              <span class="plus">+</span> Nova Campanha
            </button>
          ` : ''}
        </div>

        ${campaigns.length === 0 ? `
          <div class="empty-state">
            <div class="icon">📋</div>
            <h3>Nenhuma campanha cadastrada</h3>
            <p>${window.MetLifeAuth.isAdmin() ? 'Crie sua primeira campanha para começar a subir peças para aprovação.' : 'Aguardando a Molla cadastrar a primeira campanha.'}</p>
            ${window.MetLifeAuth.isAdmin() ? `
              <button class="btn-primary" id="btnNewCampaignEmpty">
                <span class="plus">+</span> Criar primeira campanha
              </button>
            ` : ''}
          </div>
        ` : `
          <div class="cards-grid">
            ${campaigns.map(c => this.campaignCardHtml(c)).join('')}
          </div>
        `}
      `;
      this.el.content.innerHTML = html;

      const newBtn = document.getElementById('btnNewCampaign');
      const newBtnEmpty = document.getElementById('btnNewCampaignEmpty');
      if (newBtn) newBtn.addEventListener('click', () => Modals.openCampaign());
      if (newBtnEmpty) newBtnEmpty.addEventListener('click', () => Modals.openCampaign());

      this.el.content.querySelectorAll('.campaign-card').forEach(card => {
        const id = card.dataset.id;
        card.addEventListener('click', (e) => {
          if (e.target.closest('.action-btn')) return;
          Router.go(`#/c/${id}`);
        });
        const editBtn = card.querySelector('.edit-btn');
        if (editBtn) editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          Modals.openCampaign(id);
        });
        const del = card.querySelector('.delete-btn');
        if (del) del.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm('Excluir esta campanha e todas as suas peças? Esta ação não pode ser desfeita.')) return;
          try {
            del.disabled = true;
            await Store.deleteCampaign(id);
            Toast.show('Campanha excluída.', 'success');
            await this.renderHomeView();
          } catch (err) {
            safeError(err);
            del.disabled = false;
          }
        });
      });
    },

    campaignCardHtml(c) {
      const stats = c.stats || { total: 0, approved: 0, rejected: 0, pending: 0 };
      return `
        <article class="campaign-card" data-id="${c.id}">
          ${window.MetLifeAuth.isAdmin() ? `
            <div class="card-actions">
              <button class="action-btn edit-btn" type="button" title="Editar campanha" aria-label="Editar">✎</button>
              <button class="action-btn delete-btn" type="button" title="Excluir campanha" aria-label="Excluir">×</button>
            </div>
          ` : ''}
          <div class="campaign-card-header">
            <span class="type-tag">${escapeHtml(c.type)}</span>
          </div>
          <h3>${escapeHtml(c.name)}</h3>
          <span class="meta">Criada em ${formatDate(c.created_at)}</span>
          <div class="stats-row">
            <span class="stat-mini total"><span class="dot"></span>${stats.total} peças</span>
            <span class="stat-mini approved"><span class="dot"></span>${stats.approved}</span>
            <span class="stat-mini rejected"><span class="dot"></span>${stats.rejected}</span>
            <span class="stat-mini pending"><span class="dot"></span>${stats.pending}</span>
          </div>
          <span class="cta">Abrir campanha</span>
        </article>
      `;
    },

    // ----- CAMPAIGN VIEW -----
    async renderCampaignView(campaignId) {
      this.el.crumb.innerHTML = `
        <a href="/">Hub</a> &nbsp;/&nbsp;
        <a href="#/" id="crumbHome">Aprovação</a> &nbsp;/&nbsp;
        <em>carregando...</em>
      `;
      const ch = document.getElementById('crumbHome');
      if (ch) ch.addEventListener('click', (e) => { e.preventDefault(); Router.go('#/'); });

      this.el.content.innerHTML = loadingHtml('Carregando campanha...');

      let campaign, pieces;
      try {
        [campaign, pieces] = await Promise.all([
          Store.getCampaign(campaignId),
          Store.loadPieces(campaignId)
        ]);
      } catch (e) {
        this.el.content.innerHTML = errorHtml(e, () => this.renderCampaignView(campaignId));
        return;
      }

      if (!campaign) {
        Toast.show('Campanha não encontrada.', 'error');
        Router.go('#/');
        return;
      }

      this.el.crumb.innerHTML = `
        <a href="/">Hub</a> &nbsp;/&nbsp;
        <a href="#/" id="crumbHome">Aprovação</a> &nbsp;/&nbsp;
        <strong>${escapeHtml(campaign.name)}</strong>
      `;
      document.getElementById('crumbHome').addEventListener('click', (e) => {
        e.preventDefault(); Router.go('#/');
      });

      const stats = Store.statsFromPieces(pieces);
      const pct = (n) => stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;

      const filter = this.state.campaignFilter;
      const filtered = pieces.filter(p => filter === 'all' ? true : p.status === filter);

      const html = `
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px;">
          <button class="btn-ghost" id="btnBack">← Voltar</button>
          <div>
            <h2 style="margin:0; font-size:22px; color:var(--navy);">${escapeHtml(campaign.name)}</h2>
            <span style="font-size:12px; color:var(--muted);">${escapeHtml(campaign.type)}</span>
          </div>
        </div>

        <div class="dashboard">
          <div class="kpi kpi-total">
            <div class="kpi-label">Peças</div>
            <div class="kpi-value">${stats.total}</div>
            <div class="kpi-pct">No total</div>
          </div>
          <div class="kpi kpi-approved">
            <div class="kpi-label">Aprovadas</div>
            <div class="kpi-value">${stats.approved}</div>
            <div class="kpi-pct">${pct(stats.approved)}% do total</div>
          </div>
          <div class="kpi kpi-rejected">
            <div class="kpi-label">Reprovadas</div>
            <div class="kpi-value">${stats.rejected}</div>
            <div class="kpi-pct">${pct(stats.rejected)}% do total</div>
          </div>
          <div class="kpi kpi-pending">
            <div class="kpi-label">Pendentes</div>
            <div class="kpi-value">${stats.pending}</div>
            <div class="kpi-pct">${pct(stats.pending)}% do total</div>
          </div>
        </div>

        ${stats.total > 0 ? `
          <div class="progress" title="${stats.approved} aprov. / ${stats.rejected} reprov. / ${stats.pending} pend.">
            <div class="progress-seg progress-approved" style="width:${pct(stats.approved)}%"></div>
            <div class="progress-seg progress-rejected" style="width:${pct(stats.rejected)}%"></div>
            <div class="progress-seg progress-pending" style="width:${pct(stats.pending)}%"></div>
          </div>
        ` : ''}

        <div class="toolbar">
          <div class="toolbar-left">
            <button class="filter-pill ${filter === 'all' ? 'active' : ''}" data-filter="all">Todas <span class="count">${stats.total}</span></button>
            <button class="filter-pill ${filter === 'pending' ? 'active' : ''}" data-filter="pending">Pendentes <span class="count">${stats.pending}</span></button>
            <button class="filter-pill ${filter === 'approved' ? 'active' : ''}" data-filter="approved">Aprovadas <span class="count">${stats.approved}</span></button>
            <button class="filter-pill ${filter === 'rejected' ? 'active' : ''}" data-filter="rejected">Reprovadas <span class="count">${stats.rejected}</span></button>
          </div>
          ${window.MetLifeAuth.isAdmin() ? `
            <button class="btn-primary" id="btnNewPiece">
              <span class="plus">+</span> Nova Peça
            </button>
          ` : ''}
        </div>

        ${filtered.length === 0 ? `
          <div class="empty-state">
            <div class="icon">🎨</div>
            <h3>${stats.total === 0 ? 'Nenhuma peça nesta campanha' : 'Nenhuma peça neste filtro'}</h3>
            <p>${stats.total === 0 ? (window.MetLifeAuth.isAdmin() ? 'Suba a primeira peça para aprovação.' : 'Aguardando a Molla subir as peças.') : 'Tente outro filtro' + (window.MetLifeAuth.isAdmin() ? ' ou adicione uma nova peça.' : '.')}</p>
            ${stats.total === 0 && window.MetLifeAuth.isAdmin() ? `<button class="btn-primary" id="btnNewPieceEmpty"><span class="plus">+</span> Subir primeira peça</button>` : ''}
          </div>
        ` : `
          <div class="cards-grid">
            ${filtered.map(p => this.pieceCardHtml(p)).join('')}
          </div>
        `}
      `;
      this.el.content.innerHTML = html;

      document.getElementById('btnBack').addEventListener('click', () => Router.go('#/'));
      const newBtn = document.getElementById('btnNewPiece');
      const newBtnEmpty = document.getElementById('btnNewPieceEmpty');
      if (newBtn) newBtn.addEventListener('click', () => Modals.openPiece(campaignId));
      if (newBtnEmpty) newBtnEmpty.addEventListener('click', () => Modals.openPiece(campaignId));

      this.el.content.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          this.state.campaignFilter = pill.dataset.filter;
          this.renderCampaignView(campaignId);
        });
      });

      this.el.content.querySelectorAll('.piece-card').forEach(card => {
        card.addEventListener('click', () => Modals.openPieceDetail(campaignId, card.dataset.id));
      });
    },

    pieceCardHtml(p) {
      const statusLabel = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Reprovada' }[p.status] || 'Pendente';
      let thumb = '';
      if (p.media_type === 'image') {
        thumb = `<img src="${p.media_url}" alt="${escapeHtml(p.name)}" loading="lazy">`;
      } else if (p.media_type === 'video') {
        thumb = `<div class="placeholder">Vídeo</div><div class="video-overlay">▶</div>`;
      }
      return `
        <article class="piece-card" data-id="${p.id}" data-status="${p.status}">
          <div class="piece-thumb">
            ${thumb}
            <span class="piece-status-badge ${p.status}">
              <span class="dot"></span>${statusLabel}
            </span>
          </div>
          <div class="piece-info">
            <h4>${escapeHtml(p.name)}</h4>
            <div class="footer-row">
              <span>${relativeTime(p.created_at)}</span>
            </div>
          </div>
        </article>
      `;
    }
  };

  // ============ MODAIS ============
  const Modals = {
    async openCampaign(editId = null) {
      const isEdit = !!editId;
      let existing = null;
      if (isEdit) {
        try {
          existing = await Store.getCampaign(editId);
          if (!existing) { Toast.show('Campanha não encontrada.', 'error'); return; }
        } catch (err) { safeError(err); return; }
      }

      const datalistId = 'campTypesDl';
      const html = `
        <div class="modal-header">
          <div>
            <h2>${isEdit ? 'Editar Campanha' : 'Nova Campanha'}</h2>
            <div class="modal-sub">${isEdit ? 'Atualize os dados da campanha.' : 'Defina o nome e o tipo da campanha.'}</div>
          </div>
          <button class="modal-close" type="button" data-close>×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nome da campanha</label>
            <input type="text" id="campName" placeholder="Ex: Lançamento Família+ 2026" maxlength="120" autofocus value="${isEdit ? escapeHtml(existing.name) : ''}" />
          </div>
          <div class="form-group">
            <label>Tipo de campanha</label>
            <input type="text" id="campType" placeholder="Selecione ou digite" list="${datalistId}" maxlength="60" value="${isEdit ? escapeHtml(existing.type) : ''}" />
            <datalist id="${datalistId}">
              ${CAMPAIGN_TYPES.map(t => `<option value="${t}"></option>`).join('')}
            </datalist>
            <div class="hint">Sugestões: ${CAMPAIGN_TYPES.join(', ')}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" type="button" data-close>Cancelar</button>
          <button class="btn-primary" type="button" id="campSave">${isEdit ? 'Salvar alterações' : 'Criar campanha'}</button>
        </div>
      `;
      this._open(html, (modal) => {
        modal.querySelector('#campSave').addEventListener('click', async () => {
          const name = modal.querySelector('#campName').value.trim();
          const type = modal.querySelector('#campType').value.trim();
          if (!name) { Toast.show('Informe o nome.', 'error'); return; }
          if (!type) { Toast.show('Informe o tipo.', 'error'); return; }
          const btn = modal.querySelector('#campSave');
          const originalLabel = btn.textContent;
          btn.disabled = true; btn.textContent = 'Salvando...';
          try {
            if (isEdit) {
              await Store.updateCampaign(editId, { name, type });
              Toast.show('Campanha atualizada.', 'success');
              this._close();
              App.render();
            } else {
              const c = await Store.addCampaign(name, type);
              Toast.show('Campanha criada.', 'success');
              this._close();
              Router.go(`#/c/${c.id}`);
            }
          } catch (err) {
            safeError(err);
            btn.disabled = false; btn.textContent = originalLabel;
          }
        });
      });
    },

    async openPiece(campaignId, editId = null) {
      const isEdit = !!editId;
      let existing = null;
      if (isEdit) {
        try {
          existing = await Store.getPiece(campaignId, editId);
          if (!existing) { Toast.show('Peça não encontrada.', 'error'); return; }
        } catch (err) { safeError(err); return; }
      }

      const curMediaType = isEdit ? existing.media_type : 'image';
      const html = `
        <div class="modal-header">
          <div>
            <h2>${isEdit ? 'Editar Peça' : 'Nova Peça'}</h2>
            <div class="modal-sub">${isEdit ? 'Atualize os dados da peça.' : 'Suba a arte ou link de vídeo, com nome, copy e legenda.'}</div>
          </div>
          <button class="modal-close" type="button" data-close>×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tipo de mídia</label>
            <div class="radio-group">
              <div class="radio-pill">
                <input type="radio" id="mtImage" name="mediaType" value="image" ${curMediaType === 'image' ? 'checked' : ''} />
                <label for="mtImage">🖼  Imagem</label>
              </div>
              <div class="radio-pill">
                <input type="radio" id="mtVideo" name="mediaType" value="video" ${curMediaType === 'video' ? 'checked' : ''} />
                <label for="mtVideo">🎬  Vídeo</label>
              </div>
            </div>
          </div>

          <div class="form-group" id="grpImage" style="${curMediaType === 'image' ? '' : 'display:none;'}">
            <label>Arte (imagem)${isEdit ? ' — opcional, deixe em branco para manter a atual' : ''}</label>
            <div class="upload-area" id="dropArea">
              <div class="upload-icon">📁</div>
              <p>Clique ou arraste a imagem aqui</p>
              <span class="small">JPG, PNG ou WEBP — comprimida automaticamente</span>
              <input type="file" id="fileInput" accept="image/*" hidden />
            </div>
            <div class="upload-preview ${isEdit && existing.media_type === 'image' ? 'show' : ''}" id="preview">
              <button type="button" class="remove" id="removePreview">×</button>
              <img id="previewImg" alt="" src="${isEdit && existing.media_type === 'image' ? existing.media_url : ''}" />
            </div>
          </div>

          <div class="form-group" id="grpVideo" style="${curMediaType === 'video' ? '' : 'display:none;'}">
            <label>URL do vídeo</label>
            <input type="url" id="videoUrl" placeholder="YouTube, Vimeo ou link direto (.mp4)" value="${isEdit && existing.media_type === 'video' ? escapeHtml(existing.media_url) : ''}" />
            <div class="hint">YouTube/Vimeo serão embedados; .mp4 abre player nativo.</div>
          </div>

          <div class="form-group">
            <label>Nome da peça</label>
            <input type="text" id="pieceName" placeholder="Ex: Banner Instagram Stories — variante A" maxlength="120" value="${isEdit ? escapeHtml(existing.name) : ''}" />
          </div>

          <div class="form-group">
            <label>Copy</label>
            <textarea id="pieceCopy" placeholder="Cole aqui o texto/copy da peça..." maxlength="3000">${isEdit ? escapeHtml(existing.copy || '') : ''}</textarea>
            <div class="hint">Headline, sub, CTA — tudo que está dentro da peça.</div>
          </div>

          <div class="form-group">
            <label>Legenda</label>
            <textarea id="pieceCaption" placeholder="Texto que vai acompanhar a publicação (descrição do post, caption do Instagram, etc.)..." maxlength="3000">${isEdit ? escapeHtml(existing.caption || '') : ''}</textarea>
            <div class="hint">Texto da publicação fora da peça (caption do post).</div>
          </div>

          <div class="form-group">
            <label>Link da Peça</label>
            <input type="url" id="pieceLink" placeholder="https://... (Sharepoint, Drive, etc.)" value="${isEdit ? escapeHtml(existing.link_url || '') : ''}" />
            <div class="hint">Link pro arquivo original (Sharepoint, Google Drive, Dropbox).</div>
          </div>
        </div>
        <div class="modal-footer">
          ${isEdit ? `
            <div class="version-warning">
              <span class="version-warning-icon">ⓘ</span>
              <span>Salvar criará a <strong>v${(existing.version || 1) + 1}</strong> e reseta o status para <strong>Pendente</strong>.</span>
            </div>
          ` : ''}
          <button class="btn-secondary" type="button" data-close>Cancelar</button>
          <button class="btn-primary" type="button" id="pieceSave">${isEdit ? 'Salvar alterações' : 'Adicionar peça'}</button>
        </div>
      `;
      this._open(html, (modal) => {
        const fileInput = modal.querySelector('#fileInput');
        const dropArea = modal.querySelector('#dropArea');
        const preview = modal.querySelector('#preview');
        const previewImg = modal.querySelector('#previewImg');
        const grpImage = modal.querySelector('#grpImage');
        const grpVideo = modal.querySelector('#grpVideo');
        let imageData = null; // só atribuído se user trocar a imagem
        let imageRemoved = false; // edit: marcou pra remover

        modal.querySelectorAll('input[name="mediaType"]').forEach(r => {
          r.addEventListener('change', () => {
            const v = modal.querySelector('input[name="mediaType"]:checked').value;
            grpImage.style.display = v === 'image' ? '' : 'none';
            grpVideo.style.display = v === 'video' ? '' : 'none';
          });
        });

        dropArea.addEventListener('click', () => fileInput.click());
        dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.classList.add('drag'); });
        dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag'));
        dropArea.addEventListener('drop', (e) => {
          e.preventDefault();
          dropArea.classList.remove('drag');
          if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', () => {
          if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
        });
        modal.querySelector('#removePreview').addEventListener('click', () => {
          imageData = null;
          imageRemoved = true;
          preview.classList.remove('show');
          fileInput.value = '';
        });

        async function handleFile(file) {
          if (!file.type.startsWith('image/')) {
            Toast.show('Selecione uma imagem.', 'error');
            return;
          }
          try {
            Toast.show('Comprimindo imagem...', 'default');
            imageData = await compressImage(file);
            imageRemoved = false;
            previewImg.src = imageData;
            preview.classList.add('show');
          } catch (e) {
            Toast.show('Erro ao processar imagem.', 'error');
          }
        }

        modal.querySelector('#pieceSave').addEventListener('click', async () => {
          const mediaType = modal.querySelector('input[name="mediaType"]:checked').value;
          const name = modal.querySelector('#pieceName').value.trim();
          const copy = modal.querySelector('#pieceCopy').value.trim();
          const caption = modal.querySelector('#pieceCaption').value.trim();
          const linkUrl = modal.querySelector('#pieceLink').value.trim();
          if (!name) { Toast.show('Informe o nome da peça.', 'error'); return; }

          let mediaUrl = '';
          let videoEmbedUrl = null;

          if (mediaType === 'image') {
            if (imageData) {
              mediaUrl = imageData;
            } else if (isEdit && existing.media_type === 'image' && !imageRemoved) {
              mediaUrl = existing.media_url; // mantém a atual
            } else {
              Toast.show('Suba uma imagem.', 'error'); return;
            }
          } else {
            const u = modal.querySelector('#videoUrl').value.trim();
            if (!u) { Toast.show('Informe a URL do vídeo.', 'error'); return; }
            mediaUrl = u;
            videoEmbedUrl = toEmbedUrl(u);
          }

          const btn = modal.querySelector('#pieceSave');
          const originalLabel = btn.textContent;
          btn.disabled = true; btn.textContent = 'Salvando...';
          try {
            if (isEdit) {
              await Store.updatePiece(campaignId, editId, {
                name, copy, caption, linkUrl, mediaType, mediaUrl, videoEmbedUrl
              });
              Toast.show('Peça atualizada.', 'success');
            } else {
              await Store.addPiece(campaignId, { name, mediaType, mediaUrl, videoEmbedUrl, copy, caption, linkUrl });
              Toast.show('Peça adicionada.', 'success');
            }
            this._close();
            App.renderCampaignView(campaignId);
          } catch (err) {
            safeError(err);
            btn.disabled = false; btn.textContent = originalLabel;
          }
        });
      });
    },

    async openPieceDetail(campaignId, pieceId) {
      // Loading inicial
      this._open(`
        <div class="modal-header">
          <div><h2>Carregando...</h2></div>
          <button class="modal-close" type="button" data-close>×</button>
        </div>
        <div class="modal-body">${loadingHtml('Carregando peça...')}</div>
      `, null, 'modal-lg');

      let campaign, piece, comments;
      try {
        [campaign, piece, comments] = await Promise.all([
          Store.getCampaign(campaignId),
          Store.getPiece(campaignId, pieceId),
          Store.loadComments(pieceId)
        ]);
      } catch (err) {
        safeError(err);
        this._close();
        return;
      }

      if (!piece || !campaign) {
        Toast.show('Peça não encontrada.', 'error');
        this._close();
        return;
      }

      // Estado compartilhado entre renderInner e wireUp (escopo de openPieceDetail)
      let currentPiece = piece;

      const renderInner = async () => {
        // refresh do estado da peça (caso aprovação tenha alterado)
        const pp = await Store.getPiece(campaignId, pieceId);
        currentPiece = pp;  // expõe pra wireUp
        const cms = await Store.loadComments(pieceId, true);
        const statusLabel = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Reprovada' }[pp.status];

        // ============ Lógica de pins ============
        const FIVE_MIN_MS = 5 * 60 * 1000;
        const currentVersion = pp.version || 1;
        const currentUser = (window.MetLifeAuth.getUserName() || '').trim();
        const isClient = !window.MetLifeAuth.isAdmin();

        // Pins visíveis: comments com pin da versão ATUAL (ordenados por criação)
        const visiblePins = cms
          .filter(c => c.pin_x != null && c.pin_y != null && c.pin_version === currentVersion)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const pinNumberById = new Map(visiblePins.map((c, i) => [c.id, i + 1]));

        const canEditPin = (c) => {
          if (!isClient) return false;
          if ((c.author || '').trim() !== currentUser) return false;
          const ageMs = Date.now() - new Date(c.created_at).getTime();
          return ageMs < FIVE_MIN_MS;
        };
        const canDeleteComment = (c) => {
          if (c.kind !== 'comment') return false;
          if (!isClient) return false;
          if ((c.author || '').trim() !== currentUser) return false;
          const ageMs = Date.now() - new Date(c.created_at).getTime();
          return ageMs < FIVE_MIN_MS;
        };

        const pinsOverlayHtml = visiblePins.map((c, i) => {
          const editable = canEditPin(c);
          const tooltip = `${(c.text || '').substring(0, 80)} — ${c.author || ''}`;
          return `
            <button type="button" class="pin${editable ? ' pin-editable' : ''}"
                    data-comment-id="${c.id}"
                    data-num="${i + 1}"
                    style="left: ${c.pin_x}%; top: ${c.pin_y}%;"
                    title="${escapeHtml(tooltip)}">
              <span class="pin-num">${i + 1}</span>
            </button>
          `;
        }).join('');

        let mediaHtml = '';
        if (pp.media_type === 'image') {
          mediaHtml = `
            <div class="piece-image-wrap" data-pin-mode="off">
              <img src="${pp.media_url}" alt="${escapeHtml(pp.name)}" class="piece-image">
              <div class="pin-overlay">${pinsOverlayHtml}</div>
              <div class="pin-banner">
                <span class="pin-banner-text">📍 Clique na imagem para marcar o ponto deste comentário</span>
                <button type="button" class="pin-btn pin-btn-skip">Pular marcação</button>
                <button type="button" class="pin-btn pin-btn-cancel">Cancelar</button>
              </div>
            </div>
          `;
        } else if (pp.media_type === 'video') {
          if (pp.video_embed_url) {
            mediaHtml = `<iframe src="${pp.video_embed_url}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
          } else if (/\.(mp4|webm|mov)$/i.test(pp.media_url)) {
            mediaHtml = `<video src="${pp.media_url}" controls></video>`;
          } else {
            mediaHtml = `
              <div style="text-align:center; color:rgba(255,255,255,0.85); padding:24px;">
                <div style="font-size:32px; margin-bottom:8px;">🔗</div>
                <a href="${pp.media_url}" target="_blank" rel="noopener" style="color:var(--blue-soft); font-weight:700; text-decoration:underline; word-break:break-all;">
                  ${escapeHtml(pp.media_url)}
                </a>
                <p style="font-size:12px; opacity:0.7; margin-top:8px;">Abrir em nova aba</p>
              </div>`;
          }
        }

        return `
          <div class="modal-header">
            <div>
              <h2>${escapeHtml(pp.name)} <span class="version-tag">v${pp.version || 1}</span></h2>
              <div class="modal-sub">${escapeHtml(campaign.name)} • ${escapeHtml(campaign.type)} • Criada ${relativeTime(pp.created_at)}</div>
            </div>
            <button class="modal-close" type="button" data-close>×</button>
          </div>
          <div class="piece-detail" data-status="${pp.status}">
            <div class="piece-left">
              <div class="piece-media">${mediaHtml}</div>
              ${pp.link_url ? `
                <a class="piece-link-block" href="${escapeHtml(pp.link_url)}" target="_blank" rel="noopener noreferrer">
                  <span class="piece-link-icon">🔗</span>
                  <span class="piece-link-text">
                    <span class="piece-link-label">Arquivo original</span>
                    <span class="piece-link-host">${escapeHtml((function(u){try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return 'abrir link'}})(pp.link_url))}</span>
                  </span>
                  <span class="piece-link-arrow">↗</span>
                </a>
              ` : ''}
            </div>
            <div class="piece-side">
              ${pp.copy ? `
                <div class="copy-block">
                  <div class="label">Copy</div>
                  <p>${escapeHtml(pp.copy)}</p>
                </div>
              ` : ''}
              ${pp.caption ? `
                <div class="copy-block caption-block">
                  <div class="label">Legenda</div>
                  <p>${escapeHtml(pp.caption)}</p>
                </div>
              ` : ''}

              <div class="action-row">
                <button class="btn-approve ${pp.status === 'approved' ? 'active' : ''}" id="btnApprove" type="button">
                  ✓ ${pp.status === 'approved' ? 'Aprovada' : 'Aprovar'}
                </button>
                <button class="btn-reject ${pp.status === 'rejected' ? 'active' : ''}" id="btnReject" type="button">
                  ✗ ${pp.status === 'rejected' ? 'Reprovada' : 'Reprovar'}
                </button>
              </div>

              <div class="section-title">Histórico (${cms.length})</div>
              <div class="comments-list" id="commentsList">
                ${cms.length === 0 ? `
                  <div style="font-size:12px; color:var(--muted); text-align:center; padding:14px;">
                    Sem comentários ainda.
                  </div>
                ` : cms.map(cm => {
                  const hasPin = cm.pin_x != null && cm.pin_y != null;
                  const pinIsCurrent = hasPin && cm.pin_version === currentVersion;
                  const pinNumber = pinIsCurrent ? pinNumberById.get(cm.id) : null;
                  const pinBadge = hasPin
                    ? (pinIsCurrent
                        ? `<span class="comment-pin-badge" title="Marcado no ponto ${pinNumber}">📍 ${pinNumber}</span>`
                        : `<span class="comment-pin-badge old" title="Pin de versão anterior">📍 v${cm.pin_version}</span>`)
                    : '';
                  const canDel = canDeleteComment(cm);
                  const kindClass = cm.kind === 'action' ? 'action'
                    : cm.kind === 'action-rejected' ? 'action action-rejected'
                    : cm.kind === 'action-update' ? 'action action-update'
                    : '';
                  return `
                    <div class="comment ${kindClass}"
                         data-comment-id="${cm.id}"
                         data-pin-id="${pinIsCurrent ? cm.id : ''}">
                      <div class="comment-head">
                        ${pinBadge}
                        <span class="comment-author">${escapeHtml(cm.author)}</span>
                        <span class="comment-date">${formatDate(cm.created_at)}</span>
                        ${canDel ? `<button type="button" class="comment-delete" data-id="${cm.id}" title="Excluir comentário">×</button>` : ''}
                      </div>
                      <p class="comment-text">${escapeHtml(cm.text)}</p>
                    </div>
                  `;
                }).join('')}
              </div>

              <form class="comment-form" id="commentForm">
                <input type="text" id="commentInput" placeholder="Escreva um comentário..." maxlength="500" autocomplete="off" />
                ${(isClient && pp.media_type === 'image') ? `
                  <button type="button" id="btnPinComment" class="btn-pin-comment" title="Enviar marcando um ponto na imagem">📍</button>
                ` : ''}
                <button type="submit">Enviar</button>
              </form>

              ${(window.MetLifeAuth.isAdmin() || (pp.version || 1) > 1) ? `
                <div class="piece-side-footer">
                  ${(pp.version || 1) > 1 ? `
                    <button class="btn-ghost btn-history" id="btnHistory" type="button" title="Ver versões anteriores">
                      <span class="history-icon">⟳</span> Histórico
                    </button>
                  ` : ''}
                  ${window.MetLifeAuth.isAdmin() ? `
                    <button class="btn-ghost" id="btnEditPiece" type="button">✎ Editar peça</button>
                    <button class="btn-ghost btn-ghost-danger" id="btnDeletePiece" type="button">Excluir</button>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      };

      const wireUp = (modal) => {
        const author = window.MetLifeAuth.getUserName() || 'Anônimo';
        const btnApprove = modal.querySelector('#btnApprove');
        const btnReject = modal.querySelector('#btnReject');

        btnApprove.addEventListener('click', async () => {
          const cur = await Store.getPiece(campaignId, pieceId);
          if (cur.status === 'approved') { Toast.show('Já está aprovada.'); return; }
          btnApprove.disabled = true; btnReject.disabled = true;
          try {
            await Store.updatePieceStatus(campaignId, pieceId, 'approved', author);
            Toast.show('Peça aprovada.', 'success');
            await rerender();
            App.renderCampaignView(campaignId);
          } catch (err) {
            safeError(err);
            btnApprove.disabled = false; btnReject.disabled = false;
          }
        });

        btnReject.addEventListener('click', async () => {
          const cur = await Store.getPiece(campaignId, pieceId);
          if (cur.status === 'rejected') { Toast.show('Já está reprovada.'); return; }
          btnApprove.disabled = true; btnReject.disabled = true;
          try {
            await Store.updatePieceStatus(campaignId, pieceId, 'rejected', author);
            Toast.show('Peça reprovada.', 'success');
            await rerender();
            App.renderCampaignView(campaignId);
          } catch (err) {
            safeError(err);
            btnApprove.disabled = false; btnReject.disabled = false;
          }
        });

        // ============ Lógica de Pin / criação de comentário ============
        let pinModeText = null;

        const wrapEl = modal.querySelector('.piece-image-wrap');
        const imgEl = modal.querySelector('.piece-image');
        const submitBtn = modal.querySelector('#commentForm button[type="submit"]');
        const inputEl = modal.querySelector('#commentInput');

        const enterPinMode = (text) => {
          if (!wrapEl) return false;
          pinModeText = text;
          wrapEl.dataset.pinMode = 'on';
          if (submitBtn) submitBtn.disabled = true;
          return true;
        };
        const exitPinMode = () => {
          if (wrapEl) wrapEl.dataset.pinMode = 'off';
          pinModeText = null;
          if (submitBtn) submitBtn.disabled = false;
        };
        const savePinAndComment = async (text, x, y) => {
          if (submitBtn) submitBtn.disabled = true;
          try {
            const opts = (x != null && y != null)
              ? { pinX: x, pinY: y, pinVersion: (currentPiece && currentPiece.version) || 1 }
              : {};
            await Store.addComment(pieceId, author, text, opts);
            if (inputEl) inputEl.value = '';
            await rerender();
            const list = document.getElementById('commentsList');
            if (list) list.scrollTop = list.scrollHeight;
          } catch (err) {
            safeError(err);
          } finally {
            exitPinMode();
          }
        };

        // SUBMIT padrão: envia direto sem pin (volta ao comportamento clássico)
        modal.querySelector('#commentForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const text = inputEl.value.trim();
          if (!text) return;
          await savePinAndComment(text, null, null);
        });

        // Botão 📍 (cliente em image): ativa pin mode com texto pré-validado
        const btnPinComment = modal.querySelector('#btnPinComment');
        if (btnPinComment) {
          btnPinComment.addEventListener('click', (e) => {
            e.preventDefault();
            const text = inputEl.value.trim();
            if (!text) {
              Toast.show('Escreva o comentário primeiro, depois marque o ponto.', 'error');
              inputEl.focus();
              return;
            }
            enterPinMode(text);
          });
        }

        // Click na imagem em modo de pin → captura coords e salva
        if (imgEl) {
          imgEl.addEventListener('click', async (e) => {
            if (!wrapEl || wrapEl.dataset.pinMode !== 'on') return;
            const rect = imgEl.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            await savePinAndComment(pinModeText, x, y);
          });
        }

        // Botões de "Pular" e "Cancelar" no banner de modo
        const skipBtn = modal.querySelector('.pin-btn-skip');
        if (skipBtn) {
          skipBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await savePinAndComment(pinModeText, null, null);
          });
        }
        const cancelBtn = modal.querySelector('.pin-btn-cancel');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exitPinMode();
          });
        }

        // ESC sai do modo
        const escHandler = (e) => {
          if (e.key === 'Escape' && wrapEl && wrapEl.dataset.pinMode === 'on') {
            exitPinMode();
          }
        };
        document.addEventListener('keydown', escHandler);
        // Garante remoção quando modal fecha (será limpo no _close)
        if (this._extraCleanup) this._extraCleanup.push(() => document.removeEventListener('keydown', escHandler));

        // Click no pin → scroll pro comment
        modal.querySelectorAll('.pin').forEach(pin => {
          pin.addEventListener('click', (e) => {
            // Se em modo de criação, ignora
            if (wrapEl && wrapEl.dataset.pinMode === 'on') return;
            e.stopPropagation();
            const id = pin.dataset.commentId;
            const cm = modal.querySelector(`.comment[data-comment-id="${id}"]`);
            if (cm) {
              cm.scrollIntoView({ behavior: 'smooth', block: 'center' });
              cm.classList.add('comment-flash');
              setTimeout(() => cm.classList.remove('comment-flash'), 1400);
            }
          });
        });

        // Hover comment com pin → destaca pin
        modal.querySelectorAll('.comment[data-pin-id]').forEach(c => {
          const id = c.dataset.pinId;
          if (!id) return;
          const findPin = () => modal.querySelector(`.pin[data-comment-id="${id}"]`);
          c.addEventListener('mouseenter', () => { const p = findPin(); if (p) p.classList.add('is-active'); });
          c.addEventListener('mouseleave', () => { const p = findPin(); if (p) p.classList.remove('is-active'); });
        });

        // Excluir comment próprio (< 5min)
        modal.querySelectorAll('.comment-delete').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (!confirm('Excluir este comentário?')) return;
            try {
              await Store.deleteComment(pieceId, id);
              Toast.show('Comentário excluído.', 'success');
              await rerender();
            } catch (err) {
              safeError(err);
            }
          });
        });

        // Drag-and-drop pra mover pin (só pins editáveis)
        let dragging = null;
        modal.querySelectorAll('.pin.pin-editable').forEach(pin => {
          pin.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragging = { pin, moved: false };
            pin.classList.add('is-dragging');
          });
        });
        const onMove = (e) => {
          if (!dragging || !imgEl) return;
          dragging.moved = true;
          const rect = imgEl.getBoundingClientRect();
          const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
          const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
          dragging.pin.style.left = x + '%';
          dragging.pin.style.top = y + '%';
        };
        const onUp = async (e) => {
          if (!dragging) return;
          const wasMoved = dragging.moved;
          const pin = dragging.pin;
          pin.classList.remove('is-dragging');
          const id = pin.dataset.commentId;
          dragging = null;
          if (!wasMoved || !imgEl) return;
          const rect = imgEl.getBoundingClientRect();
          const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
          const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
          try {
            await Store.updateCommentPin(pieceId, id, x, y);
          } catch (err) {
            safeError(err);
            await rerender();
          }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        if (this._extraCleanup) {
          this._extraCleanup.push(() => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          });
        }

        const btnEditPiece = modal.querySelector('#btnEditPiece');
        if (btnEditPiece) btnEditPiece.addEventListener('click', () => {
          this._close();
          Modals.openPiece(campaignId, pieceId);
        });

        const btnHistory = modal.querySelector('#btnHistory');
        if (btnHistory) btnHistory.addEventListener('click', () => {
          Modals.openVersionsHistory(campaignId, pieceId);
        });

        const btnDeletePiece = modal.querySelector('#btnDeletePiece');
        if (btnDeletePiece) btnDeletePiece.addEventListener('click', async () => {
          if (!confirm('Excluir esta peça? Não pode ser desfeito.')) return;
          try {
            await Store.deletePiece(campaignId, pieceId);
            Toast.show('Peça excluída.', 'success');
            this._close();
            App.renderCampaignView(campaignId);
          } catch (err) {
            safeError(err);
          }
        });
      };

      const rerender = async () => {
        const modal = document.getElementById('appModal');
        if (!modal) return;
        modal.innerHTML = await renderInner();
        modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => this._close()));
        wireUp(modal);
      };

      // Render inicial
      const modal = document.getElementById('appModal');
      modal.innerHTML = await renderInner();
      modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => this._close()));
      wireUp(modal);
    },

    // ----- Internos -----
    _backdrop: null,
    _modal: null,
    _escHandler: null,

    /** Modal: Histórico de versões da peça (read-only). */
    async openVersionsHistory(campaignId, pieceId) {
      // Loading inicial
      this._open(`
        <div class="modal-header">
          <div><h2>Histórico de Versões</h2></div>
          <button class="modal-close" type="button" data-close>×</button>
        </div>
        <div class="modal-body">${loadingHtml('Carregando versões...')}</div>
      `, null, 'modal-lg');

      let current, versions;
      try {
        [current, versions] = await Promise.all([
          Store.getPiece(campaignId, pieceId),
          Store.loadPieceVersions(pieceId, true)
        ]);
      } catch (err) {
        safeError(err);
        this._close();
        return;
      }

      if (!current) {
        Toast.show('Peça não encontrada.', 'error');
        this._close();
        return;
      }

      const statusLabel = (s) => ({ pending: 'Pendente', approved: 'Aprovada', rejected: 'Reprovada' }[s] || s);

      const versionCardHtml = (v, isCurrent) => {
        let mediaThumb = '';
        if (v.media_type === 'image') {
          mediaThumb = `<img src="${v.media_url}" alt="${escapeHtml(v.name)}" loading="lazy">`;
        } else if (v.media_type === 'video') {
          mediaThumb = `<div class="video-placeholder"><span>▶ Vídeo</span></div>`;
        }
        return `
          <article class="version-card${isCurrent ? ' is-current' : ''}">
            <div class="version-thumb">${mediaThumb}</div>
            <div class="version-info">
              <div class="version-head">
                <span class="version-tag big">v${v.version}${isCurrent ? ' • atual' : ''}</span>
                <span class="version-status status-${v.status}">
                  <span class="dot"></span>${statusLabel(v.status)}
                </span>
              </div>
              <div class="version-meta">
                ${isCurrent
                  ? `Criada ${formatDate(v.created_at)}`
                  : `Snapshot ${formatDate(v.snapshot_at)} ${v.snapshot_by ? '· por <strong>' + escapeHtml(v.snapshot_by) + '</strong>' : ''}`}
              </div>
              ${v.copy ? `<div class="version-block"><span class="vlabel">Copy</span><p>${escapeHtml(v.copy)}</p></div>` : ''}
              ${v.caption ? `<div class="version-block"><span class="vlabel">Legenda</span><p>${escapeHtml(v.caption)}</p></div>` : ''}
              ${v.link_url ? `<div class="version-block"><span class="vlabel">Link da peça</span><p><a href="${escapeHtml(v.link_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(v.link_url)}</a></p></div>` : ''}
            </div>
          </article>
        `;
      };

      const allVersions = [
        // versão atual primeiro (não está em piece_versions)
        { ...current, snapshot_at: null, snapshot_by: null, _isCurrent: true },
        ...versions
      ];

      const inner = `
        <div class="modal-header">
          <div>
            <h2>Histórico — ${escapeHtml(current.name)}</h2>
            <div class="modal-sub">${allVersions.length} ${allVersions.length === 1 ? 'versão' : 'versões'} no total · versão atual <strong>v${current.version || 1}</strong></div>
          </div>
          <button class="modal-close" type="button" data-close>×</button>
        </div>
        <div class="modal-body versions-body">
          ${allVersions.length === 1 ? `
            <div class="empty-state">
              <div class="icon">📜</div>
              <h3>Nenhuma versão anterior</h3>
              <p>Quando esta peça for editada, as versões anteriores aparecerão aqui.</p>
            </div>
          ` : `
            <div class="versions-list">
              ${allVersions.map(v => versionCardHtml(v, !!v._isCurrent)).join('')}
            </div>
          `}
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" type="button" data-close>Fechar</button>
        </div>
      `;

      const m = document.getElementById('appModal');
      m.innerHTML = inner;
      m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => this._close()));
    },

    _open(innerHtml, onReady, sizeClass = '') {
      this._close(true);

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.id = 'appBackdrop';

      const modal = document.createElement('div');
      modal.className = 'modal' + (sizeClass ? ' ' + sizeClass : '');
      modal.id = 'appModal';
      modal.innerHTML = innerHtml;

      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => backdrop.classList.add('show'));

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this._close();
      });
      modal.querySelectorAll('[data-close]').forEach(b => {
        b.addEventListener('click', () => this._close());
      });

      this._escHandler = (e) => { if (e.key === 'Escape') this._close(); };
      document.addEventListener('keydown', this._escHandler);

      this._backdrop = backdrop;
      this._modal = modal;
      this._extraCleanup = [];

      if (onReady) onReady(modal);
    },

    _close(silent = false) {
      const bd = document.getElementById('appBackdrop');
      if (bd) bd.remove();
      document.body.style.overflow = '';
      if (this._escHandler) {
        document.removeEventListener('keydown', this._escHandler);
        this._escHandler = null;
      }
      if (Array.isArray(this._extraCleanup)) {
        this._extraCleanup.forEach(fn => { try { fn(); } catch(_){} });
      }
      this._extraCleanup = [];
      this._backdrop = null;
      this._modal = null;
    }
  };

  // ============ BOOT ============
  document.addEventListener('DOMContentLoaded', () => App.init());
})();
