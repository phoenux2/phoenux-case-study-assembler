-- Question engine fields for deterministic coverage selection.

alter table public.questions
  add column if not exists field_key text,
  add column if not exists options jsonb not null default '[]'::jsonb;

update public.questions
set field_key = coalesce(field_key, id::text)
where field_key is null;

alter table public.questions
  alter column field_key set not null;

create unique index if not exists questions_project_field_key_uidx
  on public.questions (project_id, field_key);
