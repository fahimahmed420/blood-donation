-- ============================================================================
-- Migration 002: donation counts (donor badges) + web push subscriptions
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- Safe to run once, after supabase/schema.sql has already been applied.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Donation counts — powers donor recognition badges everywhere donors
--    are listed (search results, dashboard).
-- ---------------------------------------------------------------------------

-- Lightweight view for logged-in donor search (joined client-side with the
-- `profiles` query, which already includes phone numbers for authenticated
-- users).
create view public.donor_donation_counts
with (security_invoker = off) as
select donor_id as id, count(*)::int as donation_count
from public.donations
group by donor_id;

grant select on public.donor_donation_counts to anon, authenticated;

-- Recreate donors_public (anonymous search) to include the same count inline.
drop view if exists public.donors_public;

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
  (p.last_donation_date is null or p.last_donation_date <= current_date - 90) as is_eligible,
  p.created_at,
  coalesce(d.donation_count, 0) as donation_count
from public.profiles p
left join public.donor_donation_counts d on d.id = p.id;

grant select on public.donors_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Web push subscriptions — free complement to SMS alerts. Only logged-in
--    donors can subscribe; only the service role (server) reads them to send
--    notifications.
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

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: owner manages own"
  on public.push_subscriptions for all
  to authenticated
  using (donor_id = auth.uid())
  with check (donor_id = auth.uid());

-- ============================================================================
-- DONE.
-- ============================================================================
