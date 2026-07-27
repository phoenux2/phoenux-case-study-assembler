-- Phoenux Case Study Assembler — Phase 1 schema
-- Provenance, confidence, and approval on mutable domain records.

create extension if not exists "pgcrypto";

create type public.approval_status as enum (
  'draft',
  'pending',
  'approved',
  'rejected',
  'blocked'
);

create type public.confidence_level as enum (
  'high',
  'medium',
  'low',
  'unknown'
);

create type public.source_type as enum (
  'file',
  'text',
  'url',
  'email',
  'note'
);

create type public.asset_permission as enum (
  'public',
  'internal',
  'restricted',
  'blocked'
);

create type public.asset_quality as enum (
  'high',
  'medium',
  'low',
  'unreviewed'
);

create type public.project_phase as enum (
  'discovery',
  'design',
  'build',
  'launch',
  'outcome',
  'unknown'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  client_name text,
  summary text,
  status text not null default 'active',
  confidence public.confidence_level not null default 'unknown',
  approval public.approval_status not null default 'draft',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  source_type public.source_type not null,
  title text not null,
  filename text,
  mime_type text,
  storage_path text,
  content_text text,
  content_summary text,
  confidence public.confidence_level not null default 'unknown',
  approval public.approval_status not null default 'draft',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  source_id uuid references public.sources (id) on delete set null,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  filename text,
  mime_type text,
  storage_path text,
  category text,
  phase public.project_phase not null default 'unknown',
  permission public.asset_permission not null default 'internal',
  quality public.asset_quality not null default 'unreviewed',
  description text,
  caption text,
  relationships jsonb not null default '[]'::jsonb,
  annotations jsonb not null default '[]'::jsonb,
  confidence public.confidence_level not null default 'unknown',
  approval public.approval_status not null default 'draft',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Phase 2+ tables reserved for later migrations; stubs keep naming aligned with DATABASE.md.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  question_type text not null,
  prompt text not null,
  why text,
  status text not null default 'open',
  confidence public.confidence_level not null default 'unknown',
  approval public.approval_status not null default 'draft',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  answered_by uuid not null references public.profiles (id) on delete restrict,
  value jsonb not null default '{}'::jsonb,
  confidence public.confidence_level not null default 'unknown',
  approval public.approval_status not null default 'draft',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.answer_assets (
  answer_id uuid not null references public.answers (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  role text not null default 'supporting',
  primary key (answer_id, asset_id)
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  claim_text text not null,
  confidence public.confidence_level not null default 'unknown',
  approval public.approval_status not null default 'draft',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  source_id uuid references public.sources (id) on delete set null,
  asset_id uuid references public.assets (id) on delete set null,
  summary text not null,
  confidence public.confidence_level not null default 'unknown',
  approval public.approval_status not null default 'draft',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  block_type text not null,
  title text,
  body jsonb not null default '{}'::jsonb,
  confidence public.confidence_level not null default 'unknown',
  approval public.approval_status not null default 'draft',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outputs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  output_type text not null,
  payload jsonb not null default '{}'::jsonb,
  confidence public.confidence_level not null default 'unknown',
  approval public.approval_status not null default 'draft',
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_owner_id_idx on public.projects (owner_id);
create index sources_project_id_idx on public.sources (project_id);
create index assets_project_id_idx on public.assets (project_id);
create index questions_project_id_idx on public.questions (project_id);
create index claims_project_id_idx on public.claims (project_id);
create index content_blocks_project_id_idx on public.content_blocks (project_id);
create index outputs_project_id_idx on public.outputs (project_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.sources enable row level security;
alter table public.assets enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.answer_assets enable row level security;
alter table public.claims enable row level security;
alter table public.evidence enable row level security;
alter table public.content_blocks enable row level security;
alter table public.outputs enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "projects_owner_all"
  on public.projects for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "sources_via_project"
  on public.sources for all
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

create policy "assets_via_project"
  on public.assets for all
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

create policy "questions_via_project"
  on public.questions for all
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

create policy "answers_via_project"
  on public.answers for all
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

create policy "answer_assets_via_project"
  on public.answer_assets for all
  using (
    exists (
      select 1
      from public.answers a
      join public.projects p on p.id = a.project_id
      where a.id = answer_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.answers a
      join public.projects p on p.id = a.project_id
      where a.id = answer_id and p.owner_id = auth.uid()
    )
  );

create policy "claims_via_project"
  on public.claims for all
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

create policy "evidence_via_claim"
  on public.evidence for all
  using (
    exists (
      select 1
      from public.claims c
      join public.projects p on p.id = c.project_id
      where c.id = claim_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.claims c
      join public.projects p on p.id = c.project_id
      where c.id = claim_id and p.owner_id = auth.uid()
    )
  );

create policy "content_blocks_via_project"
  on public.content_blocks for all
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

create policy "outputs_via_project"
  on public.outputs for all
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

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "project_files_owner_read"
  on storage.objects for select
  using (
    bucket_id = 'project-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "project_files_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'project-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "project_files_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'project-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "project_files_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'project-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
