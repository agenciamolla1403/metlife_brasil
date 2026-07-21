-- ============================================================
-- Migration: w8_form_selection
-- Objetivo: persistir estado dos checkboxes da section #definicoes
--           da week-8 (LinkedIn Lead Gen · campos do formulário nativo).
-- Aplicar via SQL Editor no Supabase Dashboard.
--
-- COMPORTAMENTO INICIAL: tabela COMEÇA VAZIA.
-- Nada vem marcado no primeiro load; cada participante marca ao vivo
-- na reunião e a seleção persiste compartilhada entre todos.
-- ============================================================

-- 1. Tabela principal
CREATE TABLE IF NOT EXISTS public.w8_form_selection (
  field_id     text        PRIMARY KEY,
  checked      boolean     NOT NULL DEFAULT false,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   text
);

COMMENT ON TABLE  public.w8_form_selection IS 'Persistência do estado dos 13 checkboxes da seção Pontos de decisão (week-8). Compartilhado entre metlife e molla. Começa vazia.';
COMMENT ON COLUMN public.w8_form_selection.field_id   IS 'Chave semântica do campo. Ex: contato.nome_sobrenome';
COMMENT ON COLUMN public.w8_form_selection.updated_by IS 'Role que fez a última alteração: metlife | molla | anon';

-- 2. Índice pra pegar a última mudança rapidinho
CREATE INDEX IF NOT EXISTS idx_w8_form_selection_updated
  ON public.w8_form_selection (updated_at DESC);

-- 3. RLS (Row Level Security) — libera leitura e escrita via anon key
--    A auth de cliente é feita client-side pelo /assets/auth.js;
--    a página só carrega pra quem passou pela senha.
ALTER TABLE public.w8_form_selection ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "w8_form_selection_read"  ON public.w8_form_selection;
DROP POLICY IF EXISTS "w8_form_selection_write" ON public.w8_form_selection;

CREATE POLICY "w8_form_selection_read"
  ON public.w8_form_selection
  FOR SELECT
  USING (true);

CREATE POLICY "w8_form_selection_write"
  ON public.w8_form_selection
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Realtime — habilita canal pra reunião ao vivo (quem tá com a página
--    aberta vê as mudanças de outros participantes na hora)
ALTER PUBLICATION supabase_realtime ADD TABLE public.w8_form_selection;

-- ============================================================
-- RESET (só se você já rodou a versão anterior com seed dos 5 defaults)
-- Descomenta e roda pra deixar a tabela vazia (comportamento atual):
-- ============================================================

-- TRUNCATE TABLE public.w8_form_selection;
