-- ============================================================
-- MetLife Brasil — Schema Aprovação de Peças (Supabase / Postgres)
-- ============================================================
-- Rodar no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new
-- ============================================================

-- 1) TABELAS
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pieces (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  media_type text not null check (media_type in ('image','video')),
  media_url text not null,
  video_embed_url text,
  copy text not null default '',
  caption text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- Migration retroativa (caso a tabela já exista sem a coluna caption)
alter table public.pieces add column if not exists caption text not null default '';

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.pieces(id) on delete cascade,
  author text not null default 'Anônimo',
  text text not null,
  kind text not null default 'comment' check (kind in ('comment','action','action-rejected')),
  created_at timestamptz not null default now()
);

-- 2) INDEXES
create index if not exists idx_pieces_campaign on public.pieces(campaign_id);
create index if not exists idx_pieces_status on public.pieces(status);
create index if not exists idx_pieces_created on public.pieces(created_at desc);
create index if not exists idx_comments_piece on public.comments(piece_id);
create index if not exists idx_comments_created on public.comments(created_at);
create index if not exists idx_campaigns_created on public.campaigns(created_at desc);

-- 3) RLS habilitado em todas as tabelas
alter table public.campaigns enable row level security;
alter table public.pieces enable row level security;
alter table public.comments enable row level security;

-- 4) POLICIES — abertas (controle de acesso é via senha do app)
drop policy if exists "anon all" on public.campaigns;
create policy "anon all" on public.campaigns
  for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "anon all" on public.pieces;
create policy "anon all" on public.pieces
  for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "anon all" on public.comments;
create policy "anon all" on public.comments
  for all to anon, authenticated
  using (true) with check (true);

-- 5) REALTIME (publicações para sync ao vivo no futuro)
alter publication supabase_realtime add table public.campaigns;
alter publication supabase_realtime add table public.pieces;
alter publication supabase_realtime add table public.comments;

-- ============================================================
-- S08 — Histórico de Versões (snapshots automáticos)
-- ============================================================

-- 1) Versão atual da peça
alter table public.pieces add column if not exists version integer not null default 1;
alter table public.pieces add column if not exists link_url text;

-- 2) Tabela de snapshots de versões anteriores
create table if not exists public.piece_versions (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.pieces(id) on delete cascade,
  version integer not null,
  name text not null,
  media_type text not null,
  media_url text not null,
  video_embed_url text,
  copy text not null default '',
  caption text not null default '',
  link_url text,
  status text not null,
  snapshot_at timestamptz not null default now(),
  snapshot_by text
);

create index if not exists idx_piece_versions_piece on public.piece_versions(piece_id);
create index if not exists idx_piece_versions_at on public.piece_versions(snapshot_at desc);

alter table public.piece_versions enable row level security;

drop policy if exists "anon all" on public.piece_versions;
create policy "anon all" on public.piece_versions
  for all to anon, authenticated
  using (true) with check (true);

alter publication supabase_realtime add table public.piece_versions;

-- 3) Permitir kind 'action-update' nos comentários
alter table public.comments drop constraint if exists comments_kind_check;
alter table public.comments add constraint comments_kind_check
  check (kind in ('comment','action','action-rejected','action-update'));

-- ============================================================
-- S09 — Pins ancorados na imagem (comentários geo-referenciados)
-- ============================================================
alter table public.comments add column if not exists pin_x numeric(5,2);
alter table public.comments add column if not exists pin_y numeric(5,2);
alter table public.comments add column if not exists pin_version integer;
