-- Migration: 20260916000010_t102_channel_manager.sql
-- T-102: Channel Manager Integration (Airbnb, Booking.com, Agoda, MakeMyTrip)
-- Apply via Supabase Dashboard SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create channel_integrations table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.channel_integrations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lodge_id            uuid NOT NULL REFERENCES public.lodges(id) ON DELETE CASCADE,
    channel_name        text NOT NULL CHECK (channel_name IN ('airbnb', 'booking_com', 'agoda', 'makemytrip', 'vrbo', 'expedia')),
    display_name        text NOT NULL,
    property_channel_id text,
    api_key             text,
    api_secret          text,
    sync_status         text NOT NULL DEFAULT 'connected' CHECK (sync_status IN ('connected', 'syncing', 'paused', 'error', 'disconnected')),
    is_active           boolean NOT NULL DEFAULT true,
    sync_inventory      boolean NOT NULL DEFAULT true,
    sync_rates          boolean NOT NULL DEFAULT true,
    last_sync_at        timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE(lodge_id, channel_name)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create channel_sync_log table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.channel_sync_log (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lodge_id            uuid NOT NULL REFERENCES public.lodges(id) ON DELETE CASCADE,
    channel_id          uuid REFERENCES public.channel_integrations(id) ON DELETE CASCADE,
    channel_name        text NOT NULL,
    sync_type           text NOT NULL CHECK (sync_type IN ('reservations_pull', 'inventory_push', 'rates_push', 'webhook')),
    status              text NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
    items_synced        integer NOT NULL DEFAULT 0,
    message             text,
    payload             jsonb,
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add channel columns to reservations table
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.reservations
    ADD COLUMN IF NOT EXISTS channel_source text DEFAULT 'direct',
    ADD COLUMN IF NOT EXISTS channel_reservation_id text,
    ADD COLUMN IF NOT EXISTS synced_at timestamptz;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_integrations_lodge ON public.channel_integrations(lodge_id, is_active);
CREATE INDEX IF NOT EXISTS idx_channel_sync_log_lodge ON public.channel_sync_log(lodge_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_channel ON public.reservations(lodge_id, channel_source);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Row Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.channel_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_sync_log ENABLE ROW LEVEL SECURITY;

-- Channel integrations scoped to lodge
CREATE POLICY "lodge_channel_integrations_select"
    ON public.channel_integrations
    FOR SELECT
    TO authenticated
    USING (lodge_id = public.get_auth_lodge_id());

CREATE POLICY "lodge_channel_integrations_all"
    ON public.channel_integrations
    FOR ALL
    TO authenticated
    USING (lodge_id = public.get_auth_lodge_id())
    WITH CHECK (lodge_id = public.get_auth_lodge_id());

-- Channel sync logs scoped to lodge
CREATE POLICY "lodge_channel_sync_log_select"
    ON public.channel_sync_log
    FOR SELECT
    TO authenticated
    USING (lodge_id = public.get_auth_lodge_id());

CREATE POLICY "lodge_channel_sync_log_insert"
    ON public.channel_sync_log
    FOR INSERT
    TO authenticated
    WITH CHECK (lodge_id = public.get_auth_lodge_id());

