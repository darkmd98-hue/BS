-- Migration: 20260915000005_t059_housekeeping.sql
-- T-059: Housekeeping Workflow
-- Adds last_cleaned_at + cleaning_status to rooms; creates cleaning_log table with RLS.
-- Apply via Supabase Dashboard SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extend rooms table
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.rooms
    add column if not exists last_cleaned_at          timestamptz,
    add column if not exists cleaning_staff_assigned  text,
    add column if not exists cleaning_status          text not null default 'clean';
-- cleaning_status: 'clean' | 'needs_cleaning' | 'in_progress'

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create cleaning_log table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.cleaning_log (
    id                  uuid        primary key default gen_random_uuid(),
    lodge_id            uuid        not null references public.lodges(id) on delete cascade,
    room_id             uuid        not null references public.rooms(id) on delete cascade,
    cleaned_by_user_id  uuid        references auth.users(id),
    cleaned_by_name     text,
    started_at          timestamptz,
    completed_at        timestamptz,
    notes               text,
    created_at          timestamptz not null default now()
);

create index if not exists idx_cleaning_log_lodge_id on public.cleaning_log(lodge_id);
create index if not exists idx_cleaning_log_room_id  on public.cleaning_log(lodge_id, room_id);
create index if not exists idx_cleaning_log_created  on public.cleaning_log(lodge_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Enable RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.cleaning_log enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS Policies — cleaning_log
--    All authenticated staff in the same lodge can select.
--    Any authenticated staff can insert (start/complete cleaning).
--    Only admin can delete.
-- ─────────────────────────────────────────────────────────────────────────────
create policy "cleaning_log_select_policy" on public.cleaning_log
    for select to authenticated
    using (lodge_id = public.get_auth_lodge_id());

create policy "cleaning_log_insert_policy" on public.cleaning_log
    for insert to authenticated
    with check (lodge_id = public.get_auth_lodge_id());

create policy "cleaning_log_update_policy" on public.cleaning_log
    for update to authenticated
    using (lodge_id = public.get_auth_lodge_id())
    with check (lodge_id = public.get_auth_lodge_id());

create policy "cleaning_log_delete_policy" on public.cleaning_log
    for delete to authenticated
    using (lodge_id = public.get_auth_lodge_id() and public.get_auth_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Convenience: mark rooms that are 'checked_out' as needing cleaning
--    (Run once to seed existing data; new checkouts handled by app logic)
-- ─────────────────────────────────────────────────────────────────────────────
-- update public.rooms set cleaning_status = 'needs_cleaning'
-- where status = 'occupied'; -- uncomment only if you want to seed existing rooms

