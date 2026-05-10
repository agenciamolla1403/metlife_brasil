/* ============================================================
   MetLife Brasil — Supabase Store
   ------------------------------------------------------------
   Camada de dados que substitui o antigo DataStore localStorage.
   API toda async. Cache em memória pra reduzir round-trips.
   ============================================================ */

(function () {
  'use strict';

  if (!window.supabase || !window.MetLifeConfig) {
    console.error('[MetLifeStore] Supabase SDK ou MetLifeConfig não carregados.');
    return;
  }

  const client = window.supabase.createClient(
    window.MetLifeConfig.SUPABASE_URL,
    window.MetLifeConfig.SUPABASE_KEY,
    { auth: { persistSession: false } }
  );

  // Cache em memória — invalidado em mutations
  const cache = {
    campaigns: null,           // array | null
    pieces: new Map(),         // campaignId -> array
    comments: new Map(),       // pieceId -> array
    versions: new Map(),       // pieceId -> array of older versions (snapshots)
  };

  function calcStats(pieces) {
    const total = pieces.length;
    const approved = pieces.filter(p => p.status === 'approved').length;
    const rejected = pieces.filter(p => p.status === 'rejected').length;
    const pending = total - approved - rejected;
    return { total, approved, rejected, pending };
  }

  const Store = {
    client,

    // ============ CAMPAIGNS ============
    async loadCampaignsWithStats(force = false) {
      if (!force && cache.campaigns) return cache.campaigns;

      const [
        { data: campaigns, error: e1 },
        { data: pieceStats, error: e2 }
      ] = await Promise.all([
        client.from('campaigns')
          .select('id, name, type, created_at')
          .order('created_at', { ascending: false }),
        client.from('pieces')
          .select('id, campaign_id, status')
      ]);

      if (e1) throw e1;
      if (e2) throw e2;

      // Agrupa stats por campanha
      const byCampaign = {};
      (pieceStats || []).forEach(p => {
        if (!byCampaign[p.campaign_id]) {
          byCampaign[p.campaign_id] = { total: 0, approved: 0, rejected: 0, pending: 0 };
        }
        byCampaign[p.campaign_id].total++;
        if (p.status === 'approved') byCampaign[p.campaign_id].approved++;
        else if (p.status === 'rejected') byCampaign[p.campaign_id].rejected++;
        else byCampaign[p.campaign_id].pending++;
      });

      const enriched = (campaigns || []).map(c => ({
        ...c,
        stats: byCampaign[c.id] || { total: 0, approved: 0, rejected: 0, pending: 0 }
      }));

      cache.campaigns = enriched;
      return enriched;
    },

    async getCampaign(id) {
      // Tenta cache
      if (cache.campaigns) {
        const found = cache.campaigns.find(c => c.id === id);
        if (found) return found;
      }
      const { data, error } = await client
        .from('campaigns')
        .select('id, name, type, created_at')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async addCampaign(name, type) {
      const { data, error } = await client
        .from('campaigns')
        .insert({ name: name.trim(), type: type.trim() })
        .select()
        .single();
      if (error) throw error;
      // Invalida lista (force reload) — stats podem ter mudado também
      cache.campaigns = null;
      return data;
    },

    async updateCampaign(id, fields) {
      const payload = {};
      if (fields.name !== undefined) payload.name = fields.name.trim();
      if (fields.type !== undefined) payload.type = fields.type.trim();
      const { data, error } = await client
        .from('campaigns')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      cache.campaigns = null;
      return data;
    },

    async deleteCampaign(id) {
      const { error } = await client.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      cache.campaigns = null;
      cache.pieces.delete(id);
    },

    // ============ PIECES ============
    async loadPieces(campaignId, force = false) {
      if (!force && cache.pieces.has(campaignId)) return cache.pieces.get(campaignId);

      const { data, error } = await client
        .from('pieces')
        .select('id, campaign_id, name, media_type, media_url, video_embed_url, copy, caption, link_url, version, status, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      cache.pieces.set(campaignId, data || []);
      return data || [];
    },

    async getPiece(campaignId, pieceId) {
      const pieces = await this.loadPieces(campaignId);
      return pieces.find(p => p.id === pieceId) || null;
    },

    async addPiece(campaignId, piece) {
      const payload = {
        campaign_id: campaignId,
        name: piece.name,
        media_type: piece.mediaType,
        media_url: piece.mediaUrl,
        video_embed_url: piece.videoEmbedUrl || null,
        copy: piece.copy || '',
        caption: piece.caption || '',
        link_url: piece.linkUrl || null,
        status: 'pending'
      };
      const { data, error } = await client
        .from('pieces')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      // Registra criação na timeline (audit log)
      const author = (window.MetLifeAuth && window.MetLifeAuth.getUserName) ? window.MetLifeAuth.getUserName() : '';
      const { data: actionComment } = await client
        .from('comments')
        .insert({
          piece_id: data.id,
          author: author || 'Admin',
          text: `Criou a peça "${piece.name}".`,
          kind: 'action-created'
        })
        .select()
        .single();

      // Atualiza cache
      const list = cache.pieces.get(campaignId) || [];
      cache.pieces.set(campaignId, [data, ...list]);
      if (actionComment) {
        const cms = cache.comments.get(data.id) || [];
        cms.push(actionComment);
        cache.comments.set(data.id, cms);
      }
      cache.campaigns = null; // stats da campanha mudaram
      return data;
    },

    async updatePiece(campaignId, pieceId, fields) {
      // 1) Pega estado atual da peça (cache ou banco)
      let pieces = cache.pieces.get(campaignId);
      if (!pieces) pieces = await this.loadPieces(campaignId);
      const current = pieces.find(p => p.id === pieceId);
      if (!current) throw new Error('Peça não encontrada');

      const author = (window.MetLifeAuth && window.MetLifeAuth.getUserName) ? window.MetLifeAuth.getUserName() : '';
      const currentVersion = current.version || 1;

      // 2) Snapshot da versão atual em piece_versions (ANTES de atualizar)
      const snapshotPayload = {
        piece_id: pieceId,
        version: currentVersion,
        name: current.name,
        media_type: current.media_type,
        media_url: current.media_url,
        video_embed_url: current.video_embed_url,
        copy: current.copy || '',
        caption: current.caption || '',
        link_url: current.link_url || null,
        status: current.status,
        snapshot_by: author || 'Admin'
      };
      const { error: eSnap } = await client.from('piece_versions').insert(snapshotPayload);
      if (eSnap) throw eSnap;

      // 3) Update da peça com novos dados + bump version + reset status pra 'pending'
      const newVersion = currentVersion + 1;
      const payload = {
        version: newVersion,
        status: 'pending'
      };
      if (fields.name !== undefined) payload.name = fields.name;
      if (fields.copy !== undefined) payload.copy = fields.copy;
      if (fields.caption !== undefined) payload.caption = fields.caption;
      if (fields.linkUrl !== undefined) payload.link_url = fields.linkUrl || null;
      if (fields.mediaType !== undefined) payload.media_type = fields.mediaType;
      if (fields.mediaUrl !== undefined) payload.media_url = fields.mediaUrl;
      if (fields.videoEmbedUrl !== undefined) payload.video_embed_url = fields.videoEmbedUrl;

      const { data, error: eUpd } = await client
        .from('pieces')
        .update(payload)
        .eq('id', pieceId)
        .select()
        .single();
      if (eUpd) throw eUpd;

      // 4) Adiciona comment-action de update na timeline
      const { data: actionComment } = await client
        .from('comments')
        .insert({
          piece_id: pieceId,
          author: author || 'Admin',
          text: `Atualizou para v${newVersion}. Status reiniciado para Pendente.`,
          kind: 'action-update'
        })
        .select()
        .single();

      // 5) Atualiza caches
      const list = cache.pieces.get(campaignId);
      if (list) {
        const idx = list.findIndex(p => p.id === pieceId);
        if (idx !== -1) list[idx] = data;
      }
      cache.versions.delete(pieceId);  // invalida cache de versões (tem uma nova)
      const cms = cache.comments.get(pieceId);
      if (cms && actionComment) cms.push(actionComment);

      cache.campaigns = null;
      return data;
    },

    /** Carrega o histórico de versões anteriores de uma peça. */
    async loadPieceVersions(pieceId, force = false) {
      if (!force && cache.versions.has(pieceId)) return cache.versions.get(pieceId);
      const { data, error } = await client
        .from('piece_versions')
        .select('id, piece_id, version, name, media_type, media_url, video_embed_url, copy, caption, link_url, status, snapshot_at, snapshot_by')
        .eq('piece_id', pieceId)
        .order('version', { ascending: false });
      if (error) throw error;
      cache.versions.set(pieceId, data || []);
      return data || [];
    },

    async deletePiece(campaignId, pieceId) {
      const { error } = await client.from('pieces').delete().eq('id', pieceId);
      if (error) throw error;
      const list = cache.pieces.get(campaignId);
      if (list) cache.pieces.set(campaignId, list.filter(p => p.id !== pieceId));
      cache.comments.delete(pieceId);
      cache.campaigns = null;
    },

    async updatePieceStatus(campaignId, pieceId, status, author) {
      // 1) Atualiza status da peça
      const { error: e1 } = await client
        .from('pieces')
        .update({ status })
        .eq('id', pieceId);
      if (e1) throw e1;

      // 2) Insere comentário-de-ação
      const { data: actionComment, error: e2 } = await client
        .from('comments')
        .insert({
          piece_id: pieceId,
          author: author || 'Anônimo',
          text: status === 'approved' ? 'Aprovou a peça.' : 'Reprovou a peça.',
          kind: status === 'approved' ? 'action' : 'action-rejected'
        })
        .select()
        .single();
      if (e2) throw e2;

      // 3) Atualiza caches
      const list = cache.pieces.get(campaignId);
      if (list) {
        const p = list.find(x => x.id === pieceId);
        if (p) p.status = status;
      }
      const cms = cache.comments.get(pieceId);
      if (cms) cms.push(actionComment);

      cache.campaigns = null; // stats mudaram
      return actionComment;
    },

    // ============ COMMENTS ============
    async loadComments(pieceId, force = false) {
      if (!force && cache.comments.has(pieceId)) return cache.comments.get(pieceId);
      const { data, error } = await client
        .from('comments')
        .select('id, piece_id, author, text, kind, pin_x, pin_y, pin_version, created_at')
        .eq('piece_id', pieceId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      cache.comments.set(pieceId, data || []);
      return data || [];
    },

    /**
     * Adiciona comentário, opcionalmente com pin (coordenadas em % e versão).
     * @param {object} opts - {pinX, pinY, pinVersion} opcionais
     */
    async addComment(pieceId, author, text, opts = {}) {
      const payload = {
        piece_id: pieceId,
        author: author || 'Anônimo',
        text: text.trim(),
        kind: 'comment'
      };
      if (opts.pinX != null && opts.pinY != null) {
        payload.pin_x = Math.max(0, Math.min(100, Number(opts.pinX)));
        payload.pin_y = Math.max(0, Math.min(100, Number(opts.pinY)));
        payload.pin_version = opts.pinVersion || null;
      }
      const { data, error } = await client
        .from('comments')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      const list = cache.comments.get(pieceId) || [];
      cache.comments.set(pieceId, [...list, data]);
      return data;
    },

    /** Remove um comentário (cliente só pode excluir o próprio, < 5min). */
    async deleteComment(pieceId, commentId) {
      const { error } = await client
        .from('comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
      const list = cache.comments.get(pieceId);
      if (list) {
        cache.comments.set(pieceId, list.filter(c => c.id !== commentId));
      }
    },

    /** Atualiza apenas as coordenadas do pin (drag & drop). */
    async updateCommentPin(pieceId, commentId, pinX, pinY) {
      const x = Math.max(0, Math.min(100, Number(pinX)));
      const y = Math.max(0, Math.min(100, Number(pinY)));
      const { data, error } = await client
        .from('comments')
        .update({ pin_x: x, pin_y: y })
        .eq('id', commentId)
        .select()
        .single();
      if (error) throw error;
      const list = cache.comments.get(pieceId);
      if (list) {
        const idx = list.findIndex(c => c.id === commentId);
        if (idx !== -1) list[idx] = data;
      }
      return data;
    },

    // ============ HELPERS ============
    statsFromPieces(pieces) {
      return calcStats(pieces);
    },

    /** Limpa todos os caches em memória. */
    invalidate() {
      cache.campaigns = null;
      cache.pieces.clear();
      cache.comments.clear();
      cache.versions.clear();
    },

    /** Healthcheck — verifica se está conectando. */
    async ping() {
      const { error } = await client
        .from('campaigns')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      return true;
    }
  };

  window.MetLifeStore = Store;
})();
