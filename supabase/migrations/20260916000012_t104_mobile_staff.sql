-- Migration: 20260916000012_t104_mobile_staff.sql
-- T-104: Mobile App — Staff & Offline Task Sync (iOS & Android FCM tokens)
-- Apply via Supabase Dashboard SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create staff_device_tokens table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_device_tokens (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lodge_id            uuid NOT NULL REFERENCES public.lodges(id) ON DELETE CASCADE,
    user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token        text NOT NULL,
    platform            text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_name         text,
    is_active           boolean NOT NULL DEFAULT true,
    last_seen_at        timestamptz NOT NULL DEFAULT now(),
    created_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE(lodge_id, user_id, device_token)
);

CREATE INDEX IF NOT EXISTS idx_staff_device_tokens_lodge ON public.staff_device_tokens(lodge_id, user_id);
CREATE INDEX IF NOT EXISTS idx_staff_device_tokens_active ON public.staff_device_tokens(lodge_id, is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Row Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.staff_device_tokens ENABLE ROW LEVEL SECURITY;

-- Select: staff can view their own lodge's device tokens
CREATE POLICY "staff_device_tokens_select"
    ON public.staff_device_tokens
    FOR SELECT
    TO authenticated
    USING (lodge_id = public.get_auth_lodge_id());

-- Insert: staff can register their own device token
CREATE POLICY "staff_device_tokens_insert"
    ON public.staff_device_tokens
    FOR INSERT
    TO authenticated
    WITH CHECK (
        lodge_id = public.get_auth_lodge_id()
        AND user_id = auth.uid()
    );

-- Update: staff can update their own device token status
CREATE POLICY "staff_device_tokens_update"
    ON public.staff_device_tokens
    FOR UPDATE
    TO authenticated
    USING (
        lodge_id = public.get_auth_lodge_id()
        AND user_id = auth.uid()
    )
    WITH CHECK (
        lodge_id = public.get_auth_lodge_id()
        AND user_id = auth.uid()
    );

-- Delete: staff or admin can revoke a device token
CREATE POLICY "staff_device_tokens_delete"
    ON public.staff_device_tokens
    FOR DELETE
    TO authenticated
    USING (
        lodge_id = public.get_auth_lodge_id()
        AND (user_id = auth.uid() OR public.get_auth_role() = 'admin')
    );

