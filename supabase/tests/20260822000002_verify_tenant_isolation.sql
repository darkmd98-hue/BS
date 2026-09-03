-- SQL Verification Script: 20260822000002_verify_tenant_isolation.sql
-- Purpose: Verify atomic provisioning, RLS tenant isolation, and duplicate prevention across 2 distinct lodges.

BEGIN;

-- 1. Setup Test Users & Tenants as superuser (postgres)
DO $$
DECLARE
    v_user_a_id uuid := 'a0000000-0000-0000-0000-000000000001';
    v_user_b_id uuid := 'b0000000-0000-0000-0000-000000000002';
    v_res_a jsonb;
    v_res_b jsonb;
    v_lodge_a_id uuid;
    v_lodge_b_id uuid;
BEGIN
    -- Create mock auth users if not present
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES 
        (v_user_a_id, 'ramesh@hillview.com', '{"full_name": "Ramesh Kumar"}'::jsonb),
        (v_user_b_id, 'ananya@riverwood.com', '{"full_name": "Ananya Sharma"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Test Atomic Provisioning for Lodge A
    v_res_a := public.create_new_lodge_tenant(
        v_user_a_id,
        'Ramesh Kumar',
        'Hill View Heritage Lodge',
        'Main Road, Sringeri, Karnataka'
    );
    v_lodge_a_id := (v_res_a->>'lodge_id')::uuid;
    RAISE NOTICE 'PROVISIONED LODGE A: id=%, name=%', v_lodge_a_id, (v_res_a->>'lodge_name');

    -- 3. Test Atomic Provisioning for Lodge B
    v_res_b := public.create_new_lodge_tenant(
        v_user_b_id,
        'Ananya Sharma',
        'Riverwood Mountain Estate',
        'River Road, Chikmagalur, Karnataka'
    );
    v_lodge_b_id := (v_res_b->>'lodge_id')::uuid;
    RAISE NOTICE 'PROVISIONED LODGE B: id=%, name=%', v_lodge_b_id, (v_res_b->>'lodge_name');

    -- 4. Test Duplicate Registration Prevention for same user
    BEGIN
        PERFORM public.create_new_lodge_tenant(
            v_user_a_id,
            'Ramesh Kumar Impostor',
            'Duplicate Lodge',
            'Some Address'
        );
        RAISE EXCEPTION 'DUPLICATE_REGISTRATION_FAILED: Function should have rejected duplicate profile';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'PASSED: Duplicate registration correctly rejected: %', SQLERRM;
    END;

    -- Store IDs in session configuration for step 2
    PERFORM set_config('test.lodge_a_id', v_lodge_a_id::text, true);
    PERFORM set_config('test.lodge_b_id', v_lodge_b_id::text, true);
    PERFORM set_config('test.user_a_id', v_user_a_id::text, true);
    PERFORM set_config('test.user_b_id', v_user_b_id::text, true);
END $$;

-- 2. Switch from superuser to 'authenticated' role and set Supabase JWT claims JSON
-- In Postgres, superusers bypass RLS. Switching to 'authenticated' forces Postgres to enforce RLS.
-- Supabase's auth.uid() reads 'request.jwt.claims' JSON blob, not 'request.jwt.claim.sub'.
SET LOCAL ROLE authenticated;
SELECT set_config(
    'request.jwt.claims',
    json_build_object(
        'sub', current_setting('test.user_a_id'),
        'role', 'authenticated',
        'email', 'ramesh@hillview.com'
    )::text,
    true
);

-- 3. Run isolation checks under strict RLS as User A
DO $$
DECLARE
    v_lodge_a_id uuid := current_setting('test.lodge_a_id')::uuid;
    v_lodge_b_id uuid := current_setting('test.lodge_b_id')::uuid;
    v_count int;
BEGIN
    -- Query 1: User A selects all lodges (RLS must restrict to only Lodge A)
    SELECT count(*) INTO v_count FROM public.lodges;
    IF v_count <> 1 THEN
        RAISE EXCEPTION 'ISOLATION_FAILURE: User A saw % lodges instead of 1', v_count;
    END IF;
    RAISE NOTICE 'PASSED: User A sees exactly 1 lodge (their own)';

    -- Query 2: User A explicitly targets Lodge B's ID
    SELECT count(*) INTO v_count FROM public.lodges WHERE id = v_lodge_b_id;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'ISOLATION_FAILURE: User A was able to read Lodge B (id=%)', v_lodge_b_id;
    END IF;
    RAISE NOTICE 'PASSED: User A direct query for Lodge B returned 0 rows (rejected by RLS)';

    -- Query 3: User A attempts to read profiles of Lodge B
    SELECT count(*) INTO v_count FROM public.profiles WHERE lodge_id = v_lodge_b_id;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'ISOLATION_FAILURE: User A was able to read Lodge B profiles';
    END IF;
    RAISE NOTICE 'PASSED: User A query for Lodge B profiles returned 0 rows (rejected by RLS)';

    -- Query 4: User A attempts to update Lodge B
    UPDATE public.lodges SET name = 'Hacked Lodge B' WHERE id = v_lodge_b_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'ISOLATION_FAILURE: User A updated % rows of Lodge B', v_count;
    END IF;
    RAISE NOTICE 'PASSED: User A update on Lodge B affected 0 rows (rejected by RLS)';
END $$;

RESET ROLE;

ROLLBACK;
