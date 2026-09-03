-- Migration: 20260822000001_create_new_lodge_tenant_rpc.sql
-- Description: Atomic Postgres function for new tenant (lodge) & admin profile provisioning

create or replace function public.create_new_lodge_tenant(
    p_user_id uuid,
    p_owner_name text,
    p_lodge_name text,
    p_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_lodge_id uuid;
begin
    -- 1. Ensure user ID is provided and exists in auth.users
    if p_user_id is null then
        raise exception 'User ID is required';
    end if;

    if not exists (select 1 from auth.users where id = p_user_id) then
        raise exception 'User does not exist in auth.users';
    end if;

    -- 2. Ensure user doesn't already have an existing profile / tenant bound
    if exists (select 1 from public.profiles where id = p_user_id) then
        raise exception 'A profile is already registered for this user ID';
    end if;

    -- 3. Atomic step 1: Insert new tenant lodge row
    -- Server-side generated UUID guarantees client can never supply or tamper with lodge_id
    insert into public.lodges (name, address, owner_user_id)
    values (trim(p_lodge_name), nullif(trim(p_address), ''), p_user_id)
    returning id into v_lodge_id;

    -- 4. Atomic step 2: Insert new admin profile immediately bound to the new lodge_id
    insert into public.profiles (id, lodge_id, full_name, role)
    values (p_user_id, v_lodge_id, trim(p_owner_name), 'admin');

    -- 5. Return provisioned tenant metadata
    return jsonb_build_object(
        'lodge_id', v_lodge_id,
        'lodge_name', trim(p_lodge_name),
        'user_id', p_user_id,
        'role', 'admin'
    );
exception
    when others then
        -- Any failure triggers automatic rollback of the transaction
        raise;
end;
$$;

-- Grant execution permissions only to authenticated service/role contexts
revoke all on function public.create_new_lodge_tenant(uuid, text, text, text) from public;
grant execute on function public.create_new_lodge_tenant(uuid, text, text, text) to service_role;
