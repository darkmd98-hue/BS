-- Migration: 20260916000011_t103_advanced_bi.sql
-- T-103: Advanced Reporting & Business Intelligence (Expenses, P&L, RevPAR, ADR)
-- Apply via Supabase Dashboard SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create lodge_expenses table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lodge_expenses (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lodge_id            uuid NOT NULL REFERENCES public.lodges(id) ON DELETE CASCADE,
    category            text NOT NULL CHECK (category IN ('utilities', 'maintenance', 'supplies', 'payroll', 'food_beverage', 'marketing', 'taxes_licenses', 'other')),
    description         text NOT NULL,
    amount              numeric(12,2) NOT NULL CHECK (amount >= 0),
    expense_date        date NOT NULL DEFAULT CURRENT_DATE,
    paid_by_user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    payment_method      text NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'upi', 'cheque', 'other')),
    receipt_url         text,
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient financial reporting
CREATE INDEX IF NOT EXISTS idx_lodge_expenses_lodge_date ON public.lodge_expenses(lodge_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_lodge_expenses_category ON public.lodge_expenses(lodge_id, category);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Row Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.lodge_expenses ENABLE ROW LEVEL SECURITY;

-- Select: Lodge staff can read expenses for their lodge
CREATE POLICY "lodge_expenses_select"
    ON public.lodge_expenses
    FOR SELECT
    TO authenticated
    USING (lodge_id = public.get_auth_lodge_id());

-- Insert: Only admins can record lodge expenses
CREATE POLICY "lodge_expenses_insert"
    ON public.lodge_expenses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        lodge_id = public.get_auth_lodge_id() 
        AND public.get_auth_role() = 'admin'
    );

-- Update: Only admins can update lodge expenses
CREATE POLICY "lodge_expenses_update"
    ON public.lodge_expenses
    FOR UPDATE
    TO authenticated
    USING (
        lodge_id = public.get_auth_lodge_id() 
        AND public.get_auth_role() = 'admin'
    )
    WITH CHECK (
        lodge_id = public.get_auth_lodge_id() 
        AND public.get_auth_role() = 'admin'
    );

-- Delete: Only admins can delete lodge expenses
CREATE POLICY "lodge_expenses_delete"
    ON public.lodge_expenses
    FOR DELETE
    TO authenticated
    USING (
        lodge_id = public.get_auth_lodge_id() 
        AND public.get_auth_role() = 'admin'
    );

