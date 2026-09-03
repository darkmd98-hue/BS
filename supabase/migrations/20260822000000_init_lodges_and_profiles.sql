-- Migration: 20260822000000_init_lodges_and_profiles.sql
-- Description: Phase 0 schema for multi-tenant lodges and profiles with strict RLS policies

-- 1. Create custom enum types if preferred, or text with check constraints
create table if not exists public.lodges (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    address text,
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    lodge_id uuid not null references public.lodges(id) on delete cascade,
    full_name text not null,
    role text not null check (role in ('admin', 'reception')),
    created_at timestamptz not null default now()
);

-- 2. Indexes for performance and multi-tenant scoping
create index if not exists idx_lodges_owner on public.lodges(owner_user_id);
create index if not exists idx_profiles_lodge_id on public.profiles(lodge_id);
create index if not exists idx_profiles_role on public.profiles(lodge_id, role);

-- 3. Security Definer Helper Functions
-- These helpers prevent recursive RLS lookups and provide fast cached tenant resolution
create or replace function public.get_auth_lodge_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select lodge_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.get_auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- 4. Enable Row Level Security (RLS) - MANDATORY BEFORE EXPOSURE
alter table public.lodges enable row level security;
alter table public.profiles enable row level security;

-- 5. RLS Policies for `lodges`
-- SELECT: Users can only read their own lodge
create policy "lodges_select_policy"
    on public.lodges
    for select
    to authenticated
    using (id = public.get_auth_lodge_id());

-- UPDATE: Only admin of that lodge can update lodge details
create policy "lodges_update_policy"
    on public.lodges
    for update
    to authenticated
    using (
        id = public.get_auth_lodge_id() 
        and public.get_auth_role() = 'admin'
    )
    with check (
        id = public.get_auth_lodge_id() 
        and public.get_auth_role() = 'admin'
    );

-- INSERT: Handled exclusively via server-side service role during registration
-- DELETE: Not permitted for regular clients

-- 6. RLS Policies for `profiles`
-- SELECT: Users can read their own profile, and admins can view all profiles in their lodge
create policy "profiles_select_policy"
    on public.profiles
    for select
    to authenticated
    using (
        id = auth.uid() 
        or (
            lodge_id = public.get_auth_lodge_id() 
            and public.get_auth_role() = 'admin'
        )
    );

-- UPDATE: Admin can update profiles in their lodge; users can update their own full_name
create policy "profiles_update_policy"
    on public.profiles
    for update
    to authenticated
    using (
        (id = auth.uid() and lodge_id = public.get_auth_lodge_id())
        or (
            lodge_id = public.get_auth_lodge_id() 
            and public.get_auth_role() = 'admin'
        )
    )
    with check (
        -- Never allow altering lodge_id via client update
        lodge_id = public.get_auth_lodge_id()
    );
-- INSERT: Controlled via service role during registration / invite flow
-- DELETE: Admins can delete profiles in their own lodge (except cannot delete themselves here)
create policy "profiles_delete_policy"
    on public.profiles
    for delete
    to authenticated
    using (
        lodge_id = public.get_auth_lodge_id() 
        and public.get_auth_role() = 'admin'
        and id <> auth.uid()
    );
