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

-- ---------------------------------------------------------------------
-- Paystack payment tracking (Claude Code Brief #4)
-- Safe to re-run: every column addition is guarded with `if not exists`.
-- All money columns are kobo (Paystack's own unit, price * 100) as
-- integers, to avoid floating-point rounding on currency.
--
-- cohort_start_date is the first day of the month the buyer chose in
-- checkout's "Choose your cohort" dropdown (e.g. "September 2026" ->
-- 2026-09-01). balance_due_date is derived from it — start of the
-- *second* month of the program, not a fixed day-count from purchase —
-- so it has to be computed once the cohort is known, not hardcoded.
--
-- The two Paystack reference columns are separate because a single
-- installment enrollment involves two independent charges (the 70%
-- deposit, then later the 30% balance), each with its own transaction
-- reference for support/reconciliation.
-- ---------------------------------------------------------------------
alter table public.enrollments
  add column if not exists payment_plan text check (payment_plan in ('full', 'installment')),
  add column if not exists amount_paid_kobo integer not null default 0,
  add column if not exists remaining_balance_kobo integer not null default 0,
  add column if not exists cohort_start_date date,
  add column if not exists balance_due_date date,
  add column if not exists installment_status text check (installment_status in ('paid', 'pending', 'overdue')),
  add column if not exists paystack_reference text,
  add column if not exists paystack_reference_balance text;

create index if not exists enrollments_balance_due_idx
  on public.enrollments (balance_due_date)
  where installment_status = 'pending';
