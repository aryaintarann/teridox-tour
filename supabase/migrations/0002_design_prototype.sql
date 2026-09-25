-- Align the schema with the TeridoxTour prototype: destination-based catalogue, multi-day trips,
-- per-person pricing with a service fee + 11% tax, and a booking status timeline.

alter table public.packages
  drop column duration_hours,
  drop column category,
  add column destination text not null default 'Bali',
  add column duration_days int not null default 1 check (duration_days > 0),
  add column rating numeric(2, 1) check (rating between 0 and 5),       -- vendor-entered, shown when set
  add column review_count int check (review_count >= 0);
alter table public.packages alter column max_participants set default 8;
comment on column public.packages.price is 'IDR per person';
comment on column public.packages.capacity is 'Private groups (boats/cars) per day';

alter table public.bookings
  add column subtotal bigint,
  add column service_fee bigint,
  add column tax bigint,
  add column paid_at timestamptz,
  add column confirmed_at timestamptz,
  add column completed_at timestamptz,
  add column cancelled_at timestamptz;

-- Pricing lives here and in lib/pricing.ts. Keep both in sync (pnpm check asserts the TS side).
create or replace function public.create_booking(
  p_package uuid, p_date date, p_participants int, p_pickup text, p_notes text
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_pkg public.packages;
  v_av public.availability;
  v_expired int;
  v_sub bigint;
  v_booking public.bookings;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_pkg from public.packages where id = p_package and is_active;
  if not found then raise exception 'PACKAGE_NOT_FOUND'; end if;
  -- ponytail: vendor timezone hardcoded to WITA; make it a setting if the vendor moves
  if p_date <= (now() at time zone 'Asia/Makassar')::date then raise exception 'DATE_INVALID'; end if;
  if p_participants < 1 or p_participants > v_pkg.max_participants then raise exception 'PARTICIPANTS_INVALID'; end if;
  if coalesce(trim(p_pickup), '') = '' then raise exception 'PICKUP_REQUIRED'; end if;

  insert into public.availability (package_id, date, slots_total)
  values (p_package, p_date, v_pkg.capacity)
  on conflict (package_id, date) do nothing;

  select * into v_av from public.availability
  where package_id = p_package and date = p_date
  for update;

  with expired as (
    update public.bookings set status = 'cancelled', cancelled_at = now()
    where package_id = p_package and booking_date = p_date
      and status = 'pending' and created_at < now() - interval '90 minutes'
    returning 1
  ) select count(*) into v_expired from expired;
  v_av.slots_booked := v_av.slots_booked - v_expired;

  if v_av.is_blocked or v_av.slots_booked >= v_av.slots_total then
    raise exception 'DATE_FULL';
  end if;

  update public.availability set slots_booked = v_av.slots_booked + 1 where id = v_av.id;

  v_sub := v_pkg.price * p_participants;
  insert into public.bookings
    (user_id, package_id, booking_date, participants, pickup_location, notes,
     subtotal, service_fee, tax, total_price, booking_code)
  values
    (v_uid, p_package, p_date, p_participants, trim(p_pickup), nullif(trim(coalesce(p_notes, '')), ''),
     v_sub, 250000, round(v_sub * 0.11), v_sub + 250000 + round(v_sub * 0.11),
     'TDX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)))
  returning * into v_booking;

  return v_booking;
end $$;

create or replace function public.release_booking(p_booking uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_b public.bookings;
begin
  update public.bookings set status = 'cancelled', cancelled_at = now()
  where id = p_booking and status in ('pending', 'paid', 'confirmed')
  returning * into v_b;
  if not found then return false; end if;
  update public.availability set slots_booked = greatest(slots_booked - 1, 0)
  where package_id = v_b.package_id and date = v_b.booking_date;
  return true;
end $$;

revoke execute on function public.create_booking from public, anon;
grant execute on function public.create_booking to authenticated;
revoke execute on function public.release_booking from public, anon, authenticated;
