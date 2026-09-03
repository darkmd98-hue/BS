-- Migration: 20260822000003_schema_expansion_figma_pivot.sql
-- Description: Schema expansion for Figma-driven UI — adds rooms (expanded), customers,
--              reservations, bills, payments tables and lodges.subdomain column.
--              Applied ad-hoc via Supabase Dashboard SQL Editor on 2026-09-03.
--              This file documents what is already live in the database.

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Add subdomain column to lodges (T-040)
-- ──────────────────────────────────────────────────────────────────────────────
alter table public.lodges
    add column if not exists subdomain text;

create unique index if not exists idx_lodges_subdomain
    on public.lodges (subdomain)
    where subdomain is not null;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Create rooms table (T-039)
--    Matches live schema: id, lodge_id, room_number, floor, room_type, bed_type,
--    capacity, rent, extra_person_charge, extra_bed_charge, status, amenities,
--    cleaning_staff, maintenance_issue, maintenance_priority, storage_folder, created_at
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.rooms (
    id                  uuid        primary key default gen_random_uuid(),
    lodge_id            uuid        not null references public.lodges(id) on delete cascade,
    room_number         text        not null,
    floor               integer,
    room_type           text        not null,     -- e.g. 'AC', 'Non-AC', 'Suite'
    bed_type            text        not null,     -- e.g. 'Single', 'Double', 'King'
    capacity            integer     not null,
    rent                numeric     not null,
    extra_person_charge numeric     not null default 0,
    extra_bed_charge    numeric     not null default 0,
    status              text        not null default 'available',  -- 'available' | 'occupied' | 'maintenance'
    amenities           text[]      not null default '{}',
    cleaning_staff      text,
    maintenance_issue   text,
    maintenance_priority text,
    storage_folder      text,
    created_at          timestamptz not null default now(),

    unique (lodge_id, room_number)
);

create index if not exists idx_rooms_lodge_id on public.rooms(lodge_id);
create index if not exists idx_rooms_status   on public.rooms(lodge_id, status);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Create customers table (T-039)
--    Matches live schema: id, lodge_id, name, mobile, email, address, id_type,
--    id_number, visits, total_spent, outstanding, last_stay, created_at
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.customers (
    id          uuid        primary key default gen_random_uuid(),
    lodge_id    uuid        not null references public.lodges(id) on delete cascade,
    name        text        not null,
    mobile      text        not null,
    email       text,
    address     text,
    id_type     text,       -- e.g. 'Aadhaar', 'Passport', 'Driving License'
    id_number   text,
    visits      integer     not null default 0,
    total_spent numeric     not null default 0,
    outstanding numeric     not null default 0,
    last_stay   date,
    created_at  timestamptz not null default now()
);

create index if not exists idx_customers_lodge_id on public.customers(lodge_id);
create index if not exists idx_customers_mobile   on public.customers(lodge_id, mobile);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Create reservations table (T-039)
--    Matches live schema: id, lodge_id, customer_id, room_id, check_in, check_out,
--    guests, advance, status, special_request, created_by, created_at, updated_at
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.reservations (
    id              uuid        primary key default gen_random_uuid(),
    lodge_id        uuid        not null references public.lodges(id) on delete cascade,
    customer_id     uuid        not null references public.customers(id) on delete restrict,
    room_id         uuid        not null references public.rooms(id) on delete restrict,
    check_in        date        not null,
    check_out       date        not null,
    guests          integer     not null default 1,
    advance         numeric     not null default 0,
    status          text        not null default 'upcoming',  -- 'upcoming' | 'checked_in' | 'checked_out' | 'cancelled'
    special_request text,
    created_by      uuid references auth.users(id),
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),

    check (check_out > check_in)
);

create index if not exists idx_reservations_lodge_id   on public.reservations(lodge_id);
create index if not exists idx_reservations_room_id    on public.reservations(lodge_id, room_id);
create index if not exists idx_reservations_check_in   on public.reservations(lodge_id, check_in);
create index if not exists idx_reservations_status     on public.reservations(lodge_id, status);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Create bills table (T-039)
--    Matches live schema: id, lodge_id, reservation_id, net_amount, received,
--    balance, payment_status, created_at
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.bills (
    id              uuid        primary key default gen_random_uuid(),
    lodge_id        uuid        not null references public.lodges(id) on delete cascade,
    reservation_id  uuid        not null references public.reservations(id) on delete restrict,
    net_amount      numeric     not null default 0,
    received        numeric     not null default 0,
    balance         numeric     generated always as (net_amount - received) stored,
    payment_status  text        not null default 'pending',  -- 'pending' | 'partial' | 'paid'
    created_at      timestamptz not null default now(),

    unique (reservation_id)
);

create index if not exists idx_bills_lodge_id on public.bills(lodge_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. Create payments table (T-039)
--    Matches live schema: id, lodge_id, bill_id, amount, method, paid_at
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.payments (
    id          uuid        primary key default gen_random_uuid(),
    lodge_id    uuid        not null references public.lodges(id) on delete cascade,
    bill_id     uuid        not null references public.bills(id) on delete cascade,
    amount      numeric     not null,
    method      text        not null,   -- 'Cash' | 'Card' | 'UPI' | 'Bank Transfer'
    paid_at     timestamptz not null default now()
);

create index if not exists idx_payments_lodge_id on public.payments(lodge_id);
create index if not exists idx_payments_bill_id  on public.payments(bill_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. Enable RLS on all new tables (T-041)
-- ──────────────────────────────────────────────────────────────────────────────
alter table public.rooms        enable row level security;
alter table public.customers    enable row level security;
alter table public.reservations enable row level security;
alter table public.bills        enable row level security;
alter table public.payments     enable row level security;

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. RLS Policies for new tables (T-041)
--    All policies scope to the user's own lodge via get_auth_lodge_id().
--    INSERT/DELETE are done server-side via service_role only.
-- ──────────────────────────────────────────────────────────────────────────────

-- rooms
create policy "rooms_select_policy" on public.rooms
    for select to authenticated
    using (lodge_id = public.get_auth_lodge_id());

create policy "rooms_insert_policy" on public.rooms
    for insert to authenticated
    with check (lodge_id = public.get_auth_lodge_id() and public.get_auth_role() = 'admin');

create policy "rooms_update_policy" on public.rooms
    for update to authenticated
    using (lodge_id = public.get_auth_lodge_id())
    with check (lodge_id = public.get_auth_lodge_id());

create policy "rooms_delete_policy" on public.rooms
    for delete to authenticated
    using (lodge_id = public.get_auth_lodge_id() and public.get_auth_role() = 'admin');

-- customers
create policy "customers_select_policy" on public.customers
    for select to authenticated
    using (lodge_id = public.get_auth_lodge_id());

create policy "customers_insert_policy" on public.customers
    for insert to authenticated
    with check (lodge_id = public.get_auth_lodge_id());

create policy "customers_update_policy" on public.customers
    for update to authenticated
    using (lodge_id = public.get_auth_lodge_id())
    with check (lodge_id = public.get_auth_lodge_id());

create policy "customers_delete_policy" on public.customers
    for delete to authenticated
    using (lodge_id = public.get_auth_lodge_id() and public.get_auth_role() = 'admin');

-- reservations
create policy "reservations_select_policy" on public.reservations
    for select to authenticated
    using (lodge_id = public.get_auth_lodge_id());

create policy "reservations_insert_policy" on public.reservations
    for insert to authenticated
    with check (lodge_id = public.get_auth_lodge_id());

create policy "reservations_update_policy" on public.reservations
    for update to authenticated
    using (lodge_id = public.get_auth_lodge_id())
    with check (lodge_id = public.get_auth_lodge_id());

create policy "reservations_delete_policy" on public.reservations
    for delete to authenticated
    using (lodge_id = public.get_auth_lodge_id() and public.get_auth_role() = 'admin');

-- bills
create policy "bills_select_policy" on public.bills
    for select to authenticated
    using (lodge_id = public.get_auth_lodge_id());

create policy "bills_insert_policy" on public.bills
    for insert to authenticated
    with check (lodge_id = public.get_auth_lodge_id());

create policy "bills_update_policy" on public.bills
    for update to authenticated
    using (lodge_id = public.get_auth_lodge_id())
    with check (lodge_id = public.get_auth_lodge_id());

-- payments
create policy "payments_select_policy" on public.payments
    for select to authenticated
    using (lodge_id = public.get_auth_lodge_id());

create policy "payments_insert_policy" on public.payments
    for insert to authenticated
    with check (lodge_id = public.get_auth_lodge_id());

-- ──────────────────────────────────────────────────────────────────────────────
-- NOTE: This migration file was reconstructed on 2026-09-03 to document schema
-- that was applied ad-hoc via the Supabase Dashboard SQL Editor.
-- The `if not exists` guards on all DDL make it safe to re-run without error.
-- The RLS policy CREATE statements will error if already applied — in that case
-- run each CREATE POLICY block manually only for policies not yet existing.
-- ──────────────────────────────────────────────────────────────────────────────
