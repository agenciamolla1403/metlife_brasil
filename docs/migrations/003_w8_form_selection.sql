-- ============================================================
-- Migration: w8_form_selection
-- Objetivo: persistir estado dos checkboxes da section #definicoes
--           da week-8 (LinkedIn Lead Gen · campos do formulário nativo).
-- Aplicar via SQL Editor no Supabase Dashboard.
-- ============================================================

-- 1. Tabela principal
CREATE TABLE IF NOT EXISTS public.w8_form_selection (
  field_id     text        PRIMARY KEY,
  checked      boolean     NOT NULL DEFAULT false,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   text
);

COMMENT ON TABLE  public.w8_form_selection IS 'Persistência do estado dos 13 checkboxes da seção Pontos de decisão (week-8). Compartilhado entre metlife e molla.';
COMMENT ON COLUMN public.w8_form_selection.field_id  IS 'Chave semântica do campo. Ex: contato.nome_sobrenome';
COMMENT ON COLUMN public.w8_form_selection.updated_by IS 'Role que fez a última alteração: metlife | molla';

-- 2. Seed inicial — os 5 campos que já vinham marcados por default no HTML
INSERT INTO public.w8_form_selection (field_id, checked, updated_by) VALUES
  ('contato.nome_sobrenome',          true, 'seed'),
  ('contato.email',                   true, 'seed'),
  ('contato.telefone',                true, 'seed'),
  ('contato.linkedin_url',            false, 'seed'),
  ('contato.endereco',                false, 'seed'),
  ('profissional.cargo_funcao',       true, 'seed'),
  ('profissional.nivel_experiencia',  false, 'seed'),
  ('profissional.empresa',            false, 'seed'),
  ('profissional.setor',              false, 'seed'),
  ('educacional.nivel_academico',     true, 'seed'),
  ('educacional.universidade',        false, 'seed'),
  ('educacional.datas_estudo',        false, 'seed'),
  ('educacional.genero',              false, 'seed')
ON CONFLICT (field_id) DO NOTHING;

-- 3. Índice pra pegar a última mudança rapidinho
CREATE INDEX IF NOT EXISTS idx_w8_form_selection_updated
  ON public.w8_form_selection (updated_at DESC);

-- 4. RLS (Row Level Security) — libera leitura e escrita via anon key
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

-- 5. Realtime — habilita canal pra reunião ao vivo (quem tá com a página
--    aberta vê as mudanças de outros participantes na hora)
ALTER PUBLICATION supabase_realtime ADD TABLE public.w8_form_selection;
