-- TeridoxTour initial schema. See ARCHITECTURE.md §3-§6.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  preferred_lang text not null default 'id' check (preferred_lang in ('id', 'en')),
  created_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title_id text not null,
  title_en text not null default '',
  description_id text not null default '',
  description_en text not null default '',
  includes_id text[] not null default '{}',
  includes_en text[] not null default '{}',
  excludes_id text[] not null default '{}',
  excludes_en text[] not null default '{}',
  duration_hours int not null check (duration_hours > 0),
  price bigint not null check (price > 0),              -- IDR per booking (car + driver)
  capacity int not null default 1 check (capacity > 0), -- bookings (vehicles) per day
  max_participants int not null default 6 check (max_participants > 0),
  category text not null default 'tour',
  cover_image_url text,
  is_active boolean not null default true,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

create table public.package_itinerary (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages on delete cascade,
  time_label text not null default '',
  title_id text not null,
  title_en text not null default '',
  desc_id text not null default '',
  desc_en text not null default '',
  sort_order int not null default 0
);

create table public.package_images (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages on delete cascade,
  image_url text not null,
  sort_order int not null default 0
);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages on delete cascade,
  date date not null,
  is_blocked boolean not null default false,
  slots_total int not null check (slots_total >= 0),
  slots_booked int not null default 0 check (slots_booked >= 0),
  unique (package_id, date),
  check (slots_booked <= slots_total) -- hard backstop against overbooking
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete restrict,
  package_id uuid not null references public.packages on delete restrict,
  booking_date date not null,
  participants int not null check (participants > 0),
  pickup_location text not null,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'confirmed', 'cancelled', 'completed')),
  total_price bigint not null,
  booking_code text not null unique,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.bookings (user_id);
create index on public.bookings (package_id, booking_date);
create index on public.bookings (status);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings on delete cascade,
  doku_transaction_id text not null unique, -- our Request-Id; DOKU echoes it as original_request_id
  method text,
  amount bigint not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  payment_url text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.payments (booking_id);

create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings on delete cascade,
  channel text not null check (channel in ('email', 'wa')),
  type text not null,
  status text not null,
  sent_at timestamptz not null default now()
);

-- Profile row for every auth user ------------------------------------------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, preferred_lang)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    case when new.raw_user_meta_data ->> 'preferred_lang' = 'en' then 'en' else 'id' end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Anti double-booking (ARCHITECTURE §4) ------------------------------------
create function public.create_booking(
  p_package uuid, p_date date, p_participants int, p_pickup text, p_notes text
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_pkg public.packages;
  v_av public.availability;
  v_expired int;
  v_booking public.bookings;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_pkg from public.packages where id = p_package and is_active;
  if not found then raise exception 'PACKAGE_NOT_FOUND'; end if;
  -- ponytail: vendor timezone hardcoded to WITA (Bali); make it a setting if the vendor moves
  if p_date <= (now() at time zone 'Asia/Makassar')::date then raise exception 'DATE_INVALID'; end if;
  if p_participants < 1 or p_participants > v_pkg.max_participants then raise exception 'PARTICIPANTS_INVALID'; end if;
  if coalesce(trim(p_pickup), '') = '' then raise exception 'PICKUP_REQUIRED'; end if;

  insert into public.availability (package_id, date, slots_total)
  values (p_package, p_date, v_pkg.capacity)
  on conflict (package_id, date) do nothing;

  select * into v_av from public.availability
  where package_id = p_package and date = p_date
  for update;

  -- Unpaid bookings older than the DOKU payment window (60 min) + buffer give their slot back.
  with expired as (
    update public.bookings set status = 'cancelled'
    where package_id = p_package and booking_date = p_date
      and status = 'pending' and created_at < now() - interval '90 minutes'
    returning 1
  ) select count(*) into v_expired from expired;
  v_av.slots_booked := v_av.slots_booked - v_expired;

  if v_av.is_blocked or v_av.slots_booked >= v_av.slots_total then
    raise exception 'DATE_FULL'; -- rolls back the expiry above too; the daily sweep cleans it
  end if;

  update public.availability set slots_booked = v_av.slots_booked + 1 where id = v_av.id;

  insert into public.bookings
    (user_id, package_id, booking_date, participants, pickup_location, notes, total_price, booking_code)
  values
    (v_uid, p_package, p_date, p_participants, trim(p_pickup), nullif(trim(coalesce(p_notes, '')), ''),
     v_pkg.price, 'TDX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)))
  returning * into v_booking;

  return v_booking;
end $$;

-- Cancel a booking and give its slot back. Server-only (service role).
create function public.release_booking(p_booking uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_b public.bookings;
begin
  update public.bookings set status = 'cancelled'
  where id = p_booking and status in ('pending', 'paid', 'confirmed')
  returning * into v_b;
  if not found then return false; end if;
  update public.availability set slots_booked = greatest(slots_booked - 1, 0)
  where package_id = v_b.package_id and date = v_b.booking_date;
  return true;
end $$;

-- Daily sweep so the calendar doesn't show stale holds.
create function public.expire_pending_bookings() returns int
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_n int := 0;
begin
  for v_id in select id from public.bookings
    where status = 'pending' and created_at < now() - interval '90 minutes'
  loop
    if public.release_booking(v_id) then v_n := v_n + 1; end if;
  end loop;
  return v_n;
end $$;

revoke execute on function public.create_booking from public, anon;
grant execute on function public.create_booking to authenticated;
revoke execute on function public.release_booking from public, anon, authenticated;
revoke execute on function public.expire_pending_bookings from public, anon, authenticated;
revoke execute on function public.handle_new_user from public, anon, authenticated;

-- RLS (ARCHITECTURE §6). Admin writes go through the service role on the server.
alter table public.profiles enable row level security;
alter table public.packages enable row level security;
alter table public.package_itinerary enable row level security;
alter table public.package_images enable row level security;
alter table public.availability enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.notifications_log enable row level security;

create policy "own profile read" on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, preferred_lang) on public.profiles to authenticated; -- never role

create policy "public active packages" on public.packages for select using (is_active);
create policy "public itinerary" on public.package_itinerary for select using (true);
create policy "public images" on public.package_images for select using (true);
create policy "public availability" on public.availability for select using (true);

create policy "own bookings" on public.bookings for select using (user_id = auth.uid());
create policy "own payments" on public.payments for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid())
);

-- Package photos: public read, uploads via service role only.
insert into storage.buckets (id, name, public) values ('package-images', 'package-images', true)
on conflict (id) do nothing;
