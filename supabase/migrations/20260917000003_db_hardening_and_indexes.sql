-- Solutions 22, 26, 28, 29, 30: DB Hardening, Composite Indexes, Enum Constraints, and Audit Log Retention

-- 1. Composite indexes for high-traffic query paths (Solution 26)
create index if not exists idx_reservations_lodge_status on public.reservations(lodge_id, status);
create index if not exists idx_reservations_lodge_dates on public.reservations(lodge_id, check_in, check_out);
create index if not exists idx_reservations_lodge_room on public.reservations(lodge_id, room_id);
create index if not exists idx_bills_lodge_status on public.bills(lodge_id, payment_status);
create index if not exists idx_rooms_lodge_status on public.rooms(lodge_id, status);
create index if not exists idx_customers_lodge_mobile on public.customers(lodge_id, mobile);
create index if not exists idx_payments_lodge_paid_at on public.payments(lodge_id, paid_at desc);

-- 2. Ensure refund_status on payments table (Solution 28)
alter table public.payments add column if not exists refund_status text default null;

-- 3. Enforce valid reservation status values at DB level (Solution 30)
alter table public.reservations drop constraint if exists reservations_status_check;
alter table public.reservations add constraint reservations_status_check
  check (status in ('upcoming', 'checked_in', 'checked_out', 'cancelled'));

-- 4. Audit log retention cleanup function (Solution 29)
create or replace function public.cleanup_old_audit_logs(days_to_keep integer default 90)
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.audit_logs
  where created_at < (now() - (days_to_keep || ' days')::interval);
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
