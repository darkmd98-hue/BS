-- Migration: 20260916000009_t101_multi_property.sql
-- T-101: Multi-Property Management
-- Creates user_organizations table and links lodges to organizations.
-- Apply via Supabase Dashboard SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create user_organizations table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_organizations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_name   text NOT NULL,
    role                text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'member')),
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add organization_id to lodges table
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.lodges
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.user_organizations(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_user ON public.user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_lodges_organization_id ON public.lodges(organization_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Row Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Organization owners/members can select their organizations
CREATE POLICY "user_orgs_select"
    ON public.user_organizations
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Organization owners can update their organizations
CREATE POLICY "user_orgs_update"
    ON public.user_organizations
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Organization owners can insert
CREATE POLICY "user_orgs_insert"
    ON public.user_organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

