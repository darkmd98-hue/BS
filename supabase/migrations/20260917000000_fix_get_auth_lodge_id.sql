-- Migration: Fix get_auth_lodge_id to throw instead of returning NULL
-- Prevents RLS bypass via three-valued logic when user has no profile

-- Drop old function
drop function if exists public.get_auth_lodge_id();

-- Helper function to raise exceptions
create or replace function public.raise_exception(msg text)
returns void
language plpgsql
as $$
begin
  raise exception '%', msg;
end;
$$;

-- Recreate with exception on NULL
create or replace function public.get_auth_lodge_id()
returns uuid
language sql
security definer
stable
as $$
  select coalesce(
    (select lodge_id from public.profiles where id = auth.uid()),
    (select raise_exception('No lodge_id found for authenticated user. User must have a profile.'::text)::uuid)
  );
$$;
