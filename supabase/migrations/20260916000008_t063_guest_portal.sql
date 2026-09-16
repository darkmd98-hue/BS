-- Migration: 20260916000008_t063_guest_portal.sql
-- T-063: Guest Portal (guest_sessions and guest_messages tables)
-- Apply via Supabase Dashboard SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Guest Sessions Table (for passwordless OTP / guest access)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guest_sessions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lodge_id        uuid NOT NULL REFERENCES public.lodges(id) ON DELETE CASCADE,
    reservation_id  uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    email           text NOT NULL,
    otp_code        text NOT NULL,
    session_token   text NOT NULL UNIQUE,
    is_verified     boolean NOT NULL DEFAULT false,
    expires_at      timestamptz NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast session lookups
CREATE INDEX IF NOT EXISTS idx_guest_sessions_lodge_res ON public.guest_sessions(lodge_id, reservation_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON public.guest_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_email ON public.guest_sessions(email, otp_code);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Guest Messages Table (communication between guest and front desk)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guest_messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lodge_id        uuid NOT NULL REFERENCES public.lodges(id) ON DELETE CASCADE,
    reservation_id  uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    customer_id     uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    sender          text NOT NULL CHECK (sender IN ('guest', 'staff')),
    sender_name     text NOT NULL,
    message         text NOT NULL,
    is_read         boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes for message queries
CREATE INDEX IF NOT EXISTS idx_guest_messages_res ON public.guest_messages(reservation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_guest_messages_lodge ON public.guest_messages(lodge_id, is_read);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Row Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_messages ENABLE ROW LEVEL SECURITY;

-- Staff policies (authenticated users scoped to their own lodge)
CREATE POLICY "staff_select_guest_sessions"
    ON public.guest_sessions
    FOR SELECT
    TO authenticated
    USING (lodge_id = public.get_auth_lodge_id());

CREATE POLICY "staff_delete_guest_sessions"
    ON public.guest_sessions
    FOR DELETE
    TO authenticated
    USING (lodge_id = public.get_auth_lodge_id());

CREATE POLICY "staff_all_guest_messages"
    ON public.guest_messages
    FOR ALL
    TO authenticated
    USING (lodge_id = public.get_auth_lodge_id())
    WITH CHECK (lodge_id = public.get_auth_lodge_id());

-- Guest anonymous policies (for guest portal OTP verification and messaging)
-- Sessions: anon can select and update session for OTP verification
CREATE POLICY "anon_select_guest_sessions"
    ON public.guest_sessions
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "anon_insert_guest_sessions"
    ON public.guest_sessions
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "anon_update_guest_sessions"
    ON public.guest_sessions
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Messages: anon can read and insert messages for valid reservations
CREATE POLICY "anon_select_guest_messages"
    ON public.guest_messages
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "anon_insert_guest_messages"
    ON public.guest_messages
    FOR INSERT
    TO anon
    WITH CHECK (true);

