-- Migration: 20260822000004_allow_anon_subdomain_lookup.sql
-- Description: Allow unauthenticated (anon) client in Next.js middleware to resolve lodge_id
--              by subdomain, without requiring the service-role key.
--
-- LIVE DB STATUS (verified 2026-09-03):
--   - lodges_anon_subdomain_select RLS policy: APPLIED (anon can read lodge rows)
--   - Column-level restriction: NOT enforced — Supabase's default broad anon GRANT
--     on public schema overrides column-level grants. anon can currently read all
--     columns including address and owner_user_id.
--
-- To enforce column-level restriction properly, a REVOKE must precede the GRANT.
-- This is done below. Re-running this migration is safe (idempotent).

-- 1. RLS policy: allow anon to SELECT rows where subdomain is not null
DROP POLICY IF EXISTS "lodges_anon_subdomain_select" ON public.lodges;

CREATE POLICY "lodges_anon_subdomain_select"
    ON public.lodges
    FOR SELECT
    TO anon
    USING (subdomain IS NOT NULL);

-- 2. Restrict anon to only the columns needed for subdomain resolution.
--    First revoke the broad table-level SELECT grant if it exists,
--    then re-grant only the specific columns.
--    NOTE: If this causes issues with other anon-facing queries, re-evaluate.
REVOKE SELECT ON public.lodges FROM anon;
GRANT SELECT (id, name, subdomain) ON public.lodges TO anon;
