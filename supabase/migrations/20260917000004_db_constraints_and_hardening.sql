-- Solutions 58, 59, 61, 62: DB Check Constraints and Schema Hardening

-- 1. Enforce room status enum constraint at DB level (Solution 58)
alter table public.rooms drop constraint if exists rooms_status_check;
alter table public.rooms add constraint rooms_status_check
  check (status in ('available', 'occupied', 'reserved', 'cleaning', 'maintenance'));

-- 2. Enforce NOT NULL on customer name (Solution 61)
update public.customers set name = 'Guest' where name is null or trim(name) = '';
alter table public.customers alter column name set not null;

-- 3. Index customer email per lodge for lookups and deduplication (Solution 62)
create index if not exists idx_customers_lodge_email on public.customers(lodge_id, email)
  where email is not null;

-- 4. Schema version tracking table for migration safety (Solution 60)
create table if not exists public.schema_version_history (
  version text primary key,
  applied_at timestamptz not null default now(),
  description text
);

insert into public.schema_version_history (version, description)
values ('20260917000004', 'DB constraints and schema hardening')
on conflict (version) do nothing;
