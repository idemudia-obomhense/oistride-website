-- OIStride — Supabase schema
-- Run this once in Project -> SQL Editor -> New query, after creating the project.
--
-- Tracks enrollment progress per user/program so a returning user who
-- completed Step 1 (account creation) but never finished Step 2 (checkout)
-- can be routed straight back into checkout on their next sign-in, instead
-- of landing on the homepage. First/last name and optional phone captured
-- at signup live in Supabase's built-in auth.users.raw_user_meta_data
-- (via the `data` option passed to supabase.auth.signUp()) — no separate
-- profiles table is needed for this pass.

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_slug text not null,
  status text not null default 'started' check (status in ('started', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, program_slug)
);

create index if not exists enrollments_user_id_idx on public.enrollments (user_id);

alter table public.enrollments enable row level security;

create policy "Users can view their own enrollments"
  on public.enrollments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own enrollments"
  on public.enrollments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own enrollments"
  on public.enrollments for update
  using (auth.uid() = user_id);

-- Keep updated_at current on every status change.
create or replace function public.set_enrollments_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists enrollments_set_updated_at on public.enrollments;
create trigger enrollments_set_updated_at
  before update on public.enrollments
  for each row execute function public.set_enrollments_updated_at();
