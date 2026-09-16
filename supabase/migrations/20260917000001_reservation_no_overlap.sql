-- Solution 19: Double-booking prevention via PostgreSQL exclusion constraint
create extension if not exists btree_gist;

alter table public.reservations
  drop constraint if exists no_overlapping_reservations;

alter table public.reservations
  add constraint no_overlapping_reservations
  exclude using gist (
    lodge_id with =,
    room_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (status <> 'cancelled');
