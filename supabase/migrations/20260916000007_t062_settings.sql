-- Migration: 20260916000007_t062_settings.sql
-- T-062: Settings Panel
-- Adds configuration columns to lodges table.
-- Apply via Supabase Dashboard SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Expand lodges table with configuration columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS logo_url          text;
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS website           text;
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS contact_phone     text;
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS contact_email     text;
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS check_in_time     text        DEFAULT '14:00';
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS check_out_time    text        DEFAULT '11:00';
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS currency          text        DEFAULT 'INR';
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS timezone          text        DEFAULT 'Asia/Kolkata';
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS pet_friendly      boolean     DEFAULT false;
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS cancellation_policy text      DEFAULT 'flexible';
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS extra_person_charge_default numeric(10,2) DEFAULT 500;
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS gst_number        text;
ALTER TABLE public.lodges ADD COLUMN IF NOT EXISTS updated_at        timestamptz DEFAULT now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Update anon column-level grant to include new columns for subdomain resolution
--    (anon still only gets id, name, subdomain — settings columns are NOT exposed to anon)
-- ─────────────────────────────────────────────────────────────────────────────
-- No change needed — anon grant stays restricted to (id, name, subdomain).
-- Authenticated users can already SELECT on lodges via existing RLS.

