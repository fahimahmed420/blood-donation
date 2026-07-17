-- ============================================================================
-- Savar Blood Donor Network — database schema
-- Run this ONCE in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES (one row per registered donor)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  full_name          text not null check (char_length(full_name) between 2 and 80),
  -- Bangladeshi mobile: 11 digits, starts with 013..019
  phone              text not null check (phone ~ '^01[3-9][0-9]{8}$'),
  blood_group        text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  area               text not null,
  last_donation_date date,
  is_available       boolean not null default true,
  sms_opt_in         boolean not null default true,
  -- privileged flags (protected by trigger below)
  phone_verified     boolean not null default false,  -- set by OTP flow (service role)
  is_verified        boolean not null default false,  -- set by admin after a phone call
  is_admin           boolean not null default false,
  avatar_url         text,  -- Cloudinary secure_url, optional profile photo
  created_at         timestamptz not null default now()
);

create index profiles_search_idx on public.profiles (blood_group, area);

-- ---------------------------------------------------------------------------
-- 2. BLOOD REQUESTS (public board)
-- ---------------------------------------------------------------------------
create table public.blood_requests (
  id            uuid primary key default gen_random_uuid(),
  patient_name  text not null check (char_length(patient_name) between 2 and 80),
  blood_group   text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  bags_needed   int  not null default 1 check (bags_needed between 1 and 20),
  hospital      text not null check (char_length(hospital) between 2 and 120),
  contact_phone text not null check (contact_phone ~ '^01[3-9][0-9]{8}$'),
  needed_by     date not null,
  details       text check (char_length(details) <= 500),
  status        text not null default 'open' check (status in ('open','fulfilled','expired')),
  created_by    uuid not null references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now()
);

create index blood_requests_board_idx on public.blood_requests (status, needed_by);

-- ---------------------------------------------------------------------------
-- 3. DONATIONS (history; keeps last_donation_date in sync via trigger)
-- ---------------------------------------------------------------------------
create table public.donations (
  id         uuid primary key default gen_random_uuid(),
  donor_id   uuid not null references public.profiles (id) on delete cascade,
  donated_at date not null default current_date,
  note       text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);

create index donations_donor_idx on public.donations (donor_id, donated_at desc);

-- ---------------------------------------------------------------------------
-- 4. SMS LOG (every SMS sent — powers the monthly budget cap + admin meter)
-- ---------------------------------------------------------------------------
create table public.sms_log (
  id              bigint generated always as identity primary key,
  recipient_phone text not null,
  recipient_id    uuid references public.profiles (id) on delete set null,
  sms_type        text not null check (sms_type in ('otp','alert','reminder','test')),
  request_id      uuid references public.blood_requests (id) on delete set null,
  segments        int not null default 1,
  sent_at         timestamptz not null default now()
);

create index sms_log_month_idx on public.sms_log (sent_at);
create index sms_log_recipient_idx on public.sms_log (recipient_id, sent_at desc);

-- ---------------------------------------------------------------------------
-- 5. PHONE OTPS (short-lived verification codes; service-role only)
-- ---------------------------------------------------------------------------
create table public.phone_otps (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  phone      text not null,
  code_hash  text not null,
  attempts   int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index phone_otps_user_idx on public.phone_otps (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 6. HELPERS
-- ---------------------------------------------------------------------------

-- Is the current (logged-in) user an admin?
-- SECURITY DEFINER so it can read profiles without tripping RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Protect privileged columns: a normal user must never grant themselves
-- admin/verified status. Admins, the service role, and the SQL editor
-- (postgres) are allowed through.
create or replace function public.protect_privileged_columns()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- current_user is 'authenticated' or 'anon' for API users;
  -- 'service_role' / 'postgres' bypass the protection.
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    new.is_admin       := old.is_admin;
    new.is_verified    := old.is_verified;
    new.phone_verified := old.phone_verified;
    -- changing your phone number un-verifies it
    if new.phone is distinct from old.phone then
      new.phone_verified := false;
      new.is_verified    := false;
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileged
  before update on public.profiles
  for each row execute function public.protect_privileged_columns();

-- New profiles created through the API always start unprivileged.
create or replace function public.strip_privileged_on_insert()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.is_admin       := false;
    new.is_verified    := false;
    new.phone_verified := false;
  end if;
  return new;
end;
$$;

create trigger profiles_strip_privileged_insert
  before insert on public.profiles
  for each row execute function public.strip_privileged_on_insert();

-- Recording a donation updates the donor's last_donation_date automatically.
create or replace function public.sync_last_donation()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  update public.profiles
     set last_donation_date = greatest(coalesce(last_donation_date, '1900-01-01'::date), new.donated_at)
   where id = new.donor_id;
  return new;
end;
$$;

create trigger donations_sync_last_donation
  after insert on public.donations
  for each row execute function public.sync_last_donation();

-- ---------------------------------------------------------------------------
-- 7. DONATION COUNTS — powers donor recognition badges wherever donors are
--    listed. Split into its own view so the logged-in donor search (which
--    queries `profiles` directly for phone numbers) can join it cheaply.
-- ---------------------------------------------------------------------------
create view public.donor_donation_counts
with (security_invoker = off) as
select donor_id as id, count(*)::int as donation_count
from public.donations
group by donor_id;

grant select on public.donor_donation_counts to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. PUBLIC DONOR VIEW — what logged-OUT visitors can see.
--    Deliberately EXCLUDES the phone number (anti-scraping).
--    90 days = minimum gap between whole-blood donations.
-- ---------------------------------------------------------------------------
create view public.donors_public
with (security_invoker = off) as
select
  p.id,
  p.full_name,
  p.blood_group,
  p.area,
  p.is_available,
  p.is_verified,
  p.phone_verified,
  p.last_donation_date,
  p.avatar_url,
  (p.last_donation_date is null or p.last_donation_date <= current_date - 90) as is_eligible,
  p.created_at,
  coalesce(d.donation_count, 0) as donation_count
from public.profiles p
left join public.donor_donation_counts d on d.id = p.id;

grant select on public.donors_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. WEB PUSH SUBSCRIPTIONS — free complement to SMS alerts. Only logged-in
--    donors can subscribe; only the service role (server) reads them to
--    send notifications.
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id         bigint generated always as identity primary key,
  donor_id   uuid not null references public.profiles (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_donor_idx on public.push_subscriptions (donor_id);

-- ---------------------------------------------------------------------------
-- 11. TESTIMONIALS — donors share their experience, with an optional photo.
--     New stories start unapproved so an admin can moderate before anything
--     shows up publicly (same trust model as donor verification).
-- ---------------------------------------------------------------------------
create table public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  message     text not null check (char_length(message) between 10 and 600),
  photo_url   text,
  is_approved boolean not null default false,
  created_at  timestamptz not null default now()
);

create index testimonials_author_idx on public.testimonials (author_id);
create index testimonials_approved_idx on public.testimonials (is_approved, created_at desc);

-- ---------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.blood_requests    enable row level security;
alter table public.donations         enable row level security;
alter table public.sms_log           enable row level security;
alter table public.phone_otps        enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.testimonials      enable row level security;

create policy "push_subscriptions: owner manages own"
  on public.push_subscriptions for all
  to authenticated
  using (donor_id = auth.uid())
  with check (donor_id = auth.uid());

create policy "testimonials: read approved, own, or admin"
  on public.testimonials for select
  to anon, authenticated
  using (is_approved = true or author_id = auth.uid() or public.is_admin());

create policy "testimonials: author submits own"
  on public.testimonials for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "testimonials: author or admin updates"
  on public.testimonials for update
  to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (author_id = auth.uid() and is_approved = false));

create policy "testimonials: author or admin deletes"
  on public.testimonials for delete
  to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- PROFILES: logged-in users may read full rows (incl. phone — that's the
-- point of the site). Logged-out visitors only get the donors_public view.
create policy "profiles: authenticated can read"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: user inserts own row"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles: owner or admin updates"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "profiles: owner or admin deletes"
  on public.profiles for delete
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- BLOOD REQUESTS: fully public board (requester WANTS to be contacted).
create policy "requests: anyone can read"
  on public.blood_requests for select
  to anon, authenticated
  using (true);

create policy "requests: user inserts own"
  on public.blood_requests for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "requests: owner or admin updates"
  on public.blood_requests for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

create policy "requests: owner or admin deletes"
  on public.blood_requests for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- DONATIONS: private to the donor (and admins).
create policy "donations: owner or admin reads"
  on public.donations for select
  to authenticated
  using (donor_id = auth.uid() or public.is_admin());

create policy "donations: donor inserts own"
  on public.donations for insert
  to authenticated
  with check (donor_id = auth.uid());

create policy "donations: owner or admin deletes"
  on public.donations for delete
  to authenticated
  using (donor_id = auth.uid() or public.is_admin());

-- SMS LOG: admins can read the meter; only the service role writes.
create policy "sms_log: admin reads"
  on public.sms_log for select
  to authenticated
  using (public.is_admin());

-- PHONE OTPS: no policies — only the service role touches this table.

-- ============================================================================
-- DONE. Two follow-up steps (run separately, AFTER you have signed up
-- on the site with your own account):
--
--   -- Make yourself admin (replace the email):
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'faisal@hashtagfaisal.com');
--
-- If you haven't registered as a donor yet, the row won't exist — register
-- on the site first, then run it.
-- ============================================================================
