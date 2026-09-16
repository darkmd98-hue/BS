-- Migration: 20260916000015_t107_notifications.sql
-- Description: Automated Guest & Staff Notifications (Email & SMS / Twilio & SendGrid)
--              Adds notification_templates, notification_log, and lodge_notification_settings tables.

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Create lodge_notification_settings table
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.lodge_notification_settings (
    id                  uuid        primary key default gen_random_uuid(),
    lodge_id            uuid        not null references public.lodges(id) on delete cascade,
    provider            text        not null check (provider in ('twilio', 'sendgrid', 'resend', 'postmark')),
    is_enabled          boolean     not null default false,
    api_key             text,
    api_secret          text,       -- e.g. Twilio Auth Token
    from_email          text,
    from_phone          text,       -- e.g. Twilio Phone Number
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),

    unique (lodge_id, provider)
);

create index if not exists idx_lodge_notification_settings_lodge_id
    on public.lodge_notification_settings(lodge_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Create notification_templates table
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.notification_templates (
    id                  uuid        primary key default gen_random_uuid(),
    lodge_id            uuid        not null references public.lodges(id) on delete cascade,
    name                text        not null,
    event_trigger       text        not null check (event_trigger in (
        'booking_confirmation',
        'checkin_reminder',
        'checkout_invoice',
        'cleaning_assigned',
        'payment_received'
    )),
    channel             text        not null check (channel in ('email', 'sms', 'whatsapp')),
    subject             text,       -- for email
    body_template       text        not null,
    is_enabled          boolean     not null default true,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),

    unique (lodge_id, event_trigger, channel)
);

create index if not exists idx_notification_templates_lodge_id
    on public.notification_templates(lodge_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Create notification_log table
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.notification_log (
    id                  uuid        primary key default gen_random_uuid(),
    lodge_id            uuid        not null references public.lodges(id) on delete cascade,
    recipient           text        not null,
    channel             text        not null,
    event_trigger       text        not null,
    subject             text,
    content             text        not null,
    status              text        not null default 'delivered' check (status in ('delivered', 'failed', 'queued')),
    external_msg_id     text,
    error_message       text,
    created_at          timestamptz not null default now()
);

create index if not exists idx_notification_log_lodge_id
    on public.notification_log(lodge_id);

create index if not exists idx_notification_log_created_at
    on public.notification_log(lodge_id, created_at desc);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Enable Row Level Security (RLS)
-- ──────────────────────────────────────────────────────────────────────────────
alter table public.lodge_notification_settings enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notification_log enable row level security;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. RLS Policies (lodge_id-first via get_auth_lodge_id())
-- ──────────────────────────────────────────────────────────────────────────────
drop policy if exists "lodge_notification_settings_all" on public.lodge_notification_settings;
create policy "lodge_notification_settings_all"
    on public.lodge_notification_settings
    for all
    using (lodge_id = public.get_auth_lodge_id())
    with check (lodge_id = public.get_auth_lodge_id());

drop policy if exists "notification_templates_all" on public.notification_templates;
create policy "notification_templates_all"
    on public.notification_templates
    for all
    using (lodge_id = public.get_auth_lodge_id())
    with check (lodge_id = public.get_auth_lodge_id());

drop policy if exists "notification_log_select" on public.notification_log;
create policy "notification_log_select"
    on public.notification_log
    for select
    using (lodge_id = public.get_auth_lodge_id());

drop policy if exists "notification_log_insert" on public.notification_log;
create policy "notification_log_insert"
    on public.notification_log
    for insert
    with check (lodge_id = public.get_auth_lodge_id());
