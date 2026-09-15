-- Migration: 20260915000006_t060_maintenance.sql
-- T-060: Maintenance Tracking
-- Creates maintenance_tickets table with RLS.
-- Apply via Supabase Dashboard SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create maintenance_tickets table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.maintenance_tickets (
    id                  uuid        primary key default gen_random_uuid(),
    lodge_id            uuid        not null references public.lodges(id) on delete cascade,
    room_id             uuid        references public.rooms(id) on delete cascade,
    reported_by_user_id uuid        references auth.users(id),
    reported_by_name    text,
    issue_type          text        not null default 'other',
    description         text        not null,
    priority            text        not null default 'medium',  -- 'low' | 'medium' | 'high' | 'urgent'
    status              text        not null default 'open',    -- 'open' | 'in_progress' | 'resolved'
    assigned_to_user_id uuid        references auth.users(id),
    assigned_to_name    text,
    resolved_at         timestamptz,
    resolution_notes    text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create index if not exists idx_maint_lodge_id on public.maintenance_tickets(lodge_id);
create index if not exists idx_maint_room_id  on public.maintenance_tickets(lodge_id, room_id);
create index if not exists idx_maint_status   on public.maintenance_tickets(lodge_id, status);
create index if not exists idx_maint_priority on public.maintenance_tickets(lodge_id, priority);
create index if not exists idx_maint_created  on public.maintenance_tickets(lodge_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Enable RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.maintenance_tickets enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────
create policy "maintenance_tickets_select_policy" on public.maintenance_tickets
    for select to authenticated
    using (lodge_id = public.get_auth_lodge_id());

create policy "maintenance_tickets_insert_policy" on public.maintenance_tickets
    for insert to authenticated
    with check (lodge_id = public.get_auth_lodge_id());

create policy "maintenance_tickets_update_policy" on public.maintenance_tickets
    for update to authenticated
    using (lodge_id = public.get_auth_lodge_id())
    with check (lodge_id = public.get_auth_lodge_id());

create policy "maintenance_tickets_delete_policy" on public.maintenance_tickets
    for delete to authenticated
    using (lodge_id = public.get_auth_lodge_id() and public.get_auth_role() = 'admin');

