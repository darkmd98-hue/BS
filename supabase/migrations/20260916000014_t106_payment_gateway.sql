-- Migration: 20260916000014_t106_payment_gateway.sql
-- Description: Payment Gateway Integration (Stripe & Razorpay)
--              Adds lodge_payment_gateways, payment_gateway_webhooks tables,
--              and extends payments table with gateway tracking fields.

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Create lodge_payment_gateways table
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.lodge_payment_gateways (
    id                  uuid        primary key default gen_random_uuid(),
    lodge_id            uuid        not null references public.lodges(id) on delete cascade,
    gateway_name        text        not null check (gateway_name in ('stripe', 'razorpay')),
    is_enabled          boolean     not null default false,
    publishable_key     text,
    secret_key          text,
    webhook_secret      text,
    currency            text        not null default 'INR',
    is_test_mode        boolean     not null default true,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),

    unique (lodge_id, gateway_name)
);

create index if not exists idx_lodge_payment_gateways_lodge_id
    on public.lodge_payment_gateways(lodge_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Create payment_gateway_webhooks table
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.payment_gateway_webhooks (
    id                  uuid        primary key default gen_random_uuid(),
    lodge_id            uuid        not null references public.lodges(id) on delete cascade,
    gateway             text        not null,
    event_type          text        not null,
    event_id            text        not null,
    payload             jsonb       not null default '{}'::jsonb,
    status              text        not null default 'processed', -- 'received' | 'processed' | 'failed'
    created_at          timestamptz not null default now()
);

create index if not exists idx_payment_gateway_webhooks_lodge_id
    on public.payment_gateway_webhooks(lodge_id);

create index if not exists idx_payment_gateway_webhooks_created_at
    on public.payment_gateway_webhooks(lodge_id, created_at desc);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Extend payments table with gateway tracking columns
-- ──────────────────────────────────────────────────────────────────────────────
alter table public.payments
    add column if not exists gateway_transaction_id text,
    add column if not exists gateway_order_id text,
    add column if not exists gateway_fee numeric not null default 0,
    add column if not exists refund_status text default null;

create index if not exists idx_payments_gateway_tx
    on public.payments(lodge_id, gateway_transaction_id)
    where gateway_transaction_id is not null;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Enable Row Level Security (RLS)
-- ──────────────────────────────────────────────────────────────────────────────
alter table public.lodge_payment_gateways enable row level security;
alter table public.payment_gateway_webhooks enable row level security;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. RLS Policies
-- ──────────────────────────────────────────────────────────────────────────────
-- lodge_payment_gateways: users can view and edit gateways for their own lodge
drop policy if exists "lodge_payment_gateways_select" on public.lodge_payment_gateways;
create policy "lodge_payment_gateways_select"
    on public.lodge_payment_gateways
    for select
    using (lodge_id = public.get_auth_lodge_id());

drop policy if exists "lodge_payment_gateways_insert" on public.lodge_payment_gateways;
create policy "lodge_payment_gateways_insert"
    on public.lodge_payment_gateways
    for insert
    with check (lodge_id = public.get_auth_lodge_id());

drop policy if exists "lodge_payment_gateways_update" on public.lodge_payment_gateways;
create policy "lodge_payment_gateways_update"
    on public.lodge_payment_gateways
    for update
    using (lodge_id = public.get_auth_lodge_id());

drop policy if exists "lodge_payment_gateways_delete" on public.lodge_payment_gateways;
create policy "lodge_payment_gateways_delete"
    on public.lodge_payment_gateways
    for delete
    using (lodge_id = public.get_auth_lodge_id());

-- payment_gateway_webhooks: viewable by own lodge
drop policy if exists "payment_gateway_webhooks_select" on public.payment_gateway_webhooks;
create policy "payment_gateway_webhooks_select"
    on public.payment_gateway_webhooks
    for select
    using (lodge_id = public.get_auth_lodge_id());
