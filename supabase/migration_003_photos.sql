-- ============================================================================
-- Migration 003: profile photos + testimonials (experience sharing)
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- Safe to run once, after migration_002_features.sql has already been applied.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profile photo — a Cloudinary secure_url, shown everywhere the donor
--    appears (search results, dashboard, admin panel).
-- ---------------------------------------------------------------------------
alter table public.profiles add column avatar_url text;

-- Recreate donors_public so anonymous search results also get the photo.
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
  p.avatar_url,
  (p.last_donation_date is null or p.last_donation_date <= current_date - 90) as is_eligible,
  p.created_at,
  coalesce(d.donation_count, 0) as donation_count
from public.profiles p
left join public.donor_donation_counts d on d.id = p.id;

grant select on public.donors_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Testimonials — donors share their experience, with an optional photo.
--    New stories start unapproved so an admin can moderate before anything
--    shows up publicly (same trust model as donor verification).
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

alter table public.testimonials enable row level security;

-- Everyone can read approved stories; an author can also see their own
-- pending one; admins can see everything (for the moderation queue).
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
  with check (
    -- only an admin may flip is_approved; the author can still edit their
    -- own pending text/photo before it's reviewed
    public.is_admin() or (author_id = auth.uid() and is_approved = false)
  );

create policy "testimonials: author or admin deletes"
  on public.testimonials for delete
  to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- ============================================================================
-- DONE.
-- ============================================================================
