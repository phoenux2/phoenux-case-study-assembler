-- Phase 4 knowledge base entries for retrieval.

create table if not exists public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  tags jsonb not null default '[]'::jsonb,
  ref_id text,
  confidence public.confidence_level not null default 'unknown',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_entries_project_id_idx
  on public.knowledge_entries (project_id);

alter table public.knowledge_entries enable row level security;

create policy "knowledge_via_project"
  on public.knowledge_entries for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );
