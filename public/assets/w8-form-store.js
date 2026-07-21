/* ============================================================
   w8-form-store.js — CRUD + realtime para tabela `w8_form_selection`
   Persiste os checkboxes da seção Pontos de decisão da week-8.
   Padrão de resiliência igual aos outros stores do projeto.
   ============================================================ */
(function () {
  'use strict';

  // --- Detecção de dependências ---
  const missing = [];
  if (!window.MetLifeConfig)                            missing.push('config.js (window.MetLifeConfig)');
  if (!window.supabase)                                 missing.push('supabase-js do CDN (window.supabase)');
  if (window.supabase && !window.supabase.createClient) missing.push('supabase.createClient');

  if (missing.length) {
    console.error('[w8-form-store] dependências ausentes:', missing.join(', '));
    const errMsg = 'Dependência ausente no carregamento: ' + missing.join(', ');
    const reject = () => Promise.reject(new Error(errMsg));
    window.W8FormStore = {
      _failed: true,
      _missingDeps: missing,
      list: reject, upsert: reject, clearAll: reject, ping: reject,
      subscribe() { return null; },
    };
    return;
  }

  // --- Inicialização ---
  let supabase;
  try {
    supabase = window.supabase.createClient(
      window.MetLifeConfig.SUPABASE_URL,
      window.MetLifeConfig.SUPABASE_KEY
    );
  } catch (e) {
    console.error('[w8-form-store] erro ao criar cliente:', e);
    const reject = () => Promise.reject(e);
    window.W8FormStore = {
      _failed: true,
      _initError: e,
      list: reject, upsert: reject, clearAll: reject, ping: reject,
      subscribe() { return null; },
    };
    return;
  }

  const TABLE = 'w8_form_selection';
  let channel = null;

  /** Descobre a role atual (metlife | molla) a partir do localStorage do auth. */
  function currentRole() {
    try {
      const r = localStorage.getItem('metlife_role');
      if (r === 'metlife' || r === 'molla') return r;
    } catch (e) {}
    return 'anon';
  }

  const W8FormStore = {

    /** Lê o estado completo (13 campos). Retorna {field_id: {checked, updated_at, updated_by}}. */
    async list() {
      const { data, error } = await supabase
        .from(TABLE)
        .select('field_id, checked, updated_at, updated_by');
      if (error) throw error;
      const map = {};
      (data || []).forEach(row => { map[row.field_id] = row; });
      return map;
    },

    /** Grava a decisão de UM campo. Upsert pra caso ele não exista ainda. */
    async upsert(fieldId, checked) {
      const payload = {
        field_id:   fieldId,
        checked:    !!checked,
        updated_at: new Date().toISOString(),
        updated_by: currentRole()
      };
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(payload, { onConflict: 'field_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /** Desmarca TODOS os campos de uma vez (equivalente ao antigo "Limpar seleção"). */
    async clearAll(fieldIds) {
      const payload = fieldIds.map(id => ({
        field_id:   id,
        checked:    false,
        updated_at: new Date().toISOString(),
        updated_by: currentRole()
      }));
      const { error } = await supabase
        .from(TABLE)
        .upsert(payload, { onConflict: 'field_id' });
      if (error) throw error;
      return true;
    },

    /** Healthcheck — confirma que a tabela existe. */
    async ping() {
      const { error } = await supabase
        .from(TABLE)
        .select('field_id', { count: 'exact', head: true })
        .limit(1);
      if (error) throw error;
      return true;
    },

    /** Subscribe realtime — callback dispara a cada mudança de outro participante. */
    subscribe(callback) {
      try {
        if (channel) supabase.removeChannel(channel);
        channel = supabase
          .channel('w8-form-changes')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: TABLE },
            (payload) => { try { callback(payload); } catch (e) { console.error('[w8-form-store] callback:', e); } })
          .subscribe();
        return channel;
      } catch (e) {
        console.warn('[w8-form-store] subscribe falhou (não bloqueante):', e);
        return null;
      }
    },
  };

  window.W8FormStore = W8FormStore;
})();
