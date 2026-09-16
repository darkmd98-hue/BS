-- Migration: 20260916000013_t105_advanced_rbac.sql
-- T-105: Advanced RBAC (Roles, Permission Matrix & Security Audit Log)
-- Apply via Supabase Dashboard SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create roles table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lodge_id            uuid NOT NULL REFERENCES public.lodges(id) ON DELETE CASCADE,
    name                text NOT NULL,
    description         text,
    is_system_role      boolean NOT NULL DEFAULT false,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE(lodge_id, name)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create role_permissions table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id             uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_key      text NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE(role_id, permission_key)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Create audit_log table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lodge_id            uuid NOT NULL REFERENCES public.lodges(id) ON DELETE CASCADE,
    user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email          text,
    action              text NOT NULL,
    resource_type       text NOT NULL,
    resource_id         text,
    metadata            jsonb,
    ip_address          text,
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_lodge ON public.roles(lodge_id, is_system_role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_lodge_date ON public.audit_log(lodge_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Row Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Roles: all lodge staff can read, admins can modify
CREATE POLICY "lodge_roles_select"
    ON public.roles
    FOR SELECT
    TO authenticated
    USING (lodge_id = public.get_auth_lodge_id());

CREATE POLICY "lodge_roles_admin_all"
    ON public.roles
    FOR ALL
    TO authenticated
    USING (lodge_id = public.get_auth_lodge_id() AND public.get_auth_role() = 'admin')
    WITH CHECK (lodge_id = public.get_auth_lodge_id() AND public.get_auth_role() = 'admin');

-- Role Permissions: staff can read, admins can modify
CREATE POLICY "lodge_role_permissions_select"
    ON public.role_permissions
    FOR SELECT
    TO authenticated
    USING (
        role_id IN (SELECT id FROM public.roles WHERE lodge_id = public.get_auth_lodge_id())
    );

CREATE POLICY "lodge_role_permissions_admin_all"
    ON public.role_permissions
    FOR ALL
    TO authenticated
    USING (
        role_id IN (SELECT id FROM public.roles WHERE lodge_id = public.get_auth_lodge_id() AND public.get_auth_role() = 'admin')
    )
    WITH CHECK (
        role_id IN (SELECT id FROM public.roles WHERE lodge_id = public.get_auth_lodge_id() AND public.get_auth_role() = 'admin')
    );

-- Audit Log: staff can read, actions can insert
CREATE POLICY "lodge_audit_log_select"
    ON public.audit_log
    FOR SELECT
    TO authenticated
    USING (lodge_id = public.get_auth_lodge_id());

CREATE POLICY "lodge_audit_log_insert"
    ON public.audit_log
    FOR INSERT
    TO authenticated
    WITH CHECK (lodge_id = public.get_auth_lodge_id());
