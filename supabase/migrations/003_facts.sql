-- Structured facts extracted from sources (deterministic or AI).

create table if not exists public.facts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  source_id uuid references public.sources (id) on delete set null,
  key text not null,
  value text not null,
  confidence public.confidence_level not null default 'unknown',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists facts_project_id_idx on public.facts (project_id);

alter table public.facts enable row level security;

create policy "facts_via_project"
  on public.facts for all
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
