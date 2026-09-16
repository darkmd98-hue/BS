-- Solution 20: Enforce subdomain uniqueness at database level
alter table public.lodges
  drop constraint if exists lodges_subdomain_unique;

alter table public.lodges
  add constraint lodges_subdomain_unique
  unique (subdomain);
