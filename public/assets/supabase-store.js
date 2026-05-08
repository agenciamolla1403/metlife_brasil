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
        .select('id, campaign_id, name, media_type, media_url, video_embed_url, copy, status, created_at')
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
        status: 'pending'
      };
      const { data, error } = await client
        .from('pieces')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      // Atualiza cache
      const list = cache.pieces.get(campaignId) || [];
      cache.pieces.set(campaignId, [data, ...list]);
      cache.campaigns = null; // stats da campanha mudaram
      return data;
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
        .select('id, piece_id, author, text, kind, created_at')
        .eq('piece_id', pieceId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      cache.comments.set(pieceId, data || []);
      return data || [];
    },

    async addComment(pieceId, author, text) {
      const { data, error } = await client
        .from('comments')
        .insert({
          piece_id: pieceId,
          author: author || 'Anônimo',
          text: text.trim(),
          kind: 'comment'
        })
        .select()
        .single();
      if (error) throw error;
      const list = cache.comments.get(pieceId) || [];
      cache.comments.set(pieceId, [...list, data]);
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
