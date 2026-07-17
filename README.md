# Savar Blood Donor Network

A free, non-profit website so people in Savar, Dhaka can find blood donors and
register as donors. Built with Next.js, Supabase, and free hosting on Vercel.
Bangla-first with an English toggle.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without any setup, the site renders with a
"database not configured" notice on data pages — that's expected until you
complete Step 1 below.

---

## Step 1 — Create your free Supabase project (database + login)

1. Go to https://supabase.com, sign up (free), click **New project**.
2. Pick any name (e.g. `savar-blood`), a strong database password (save it
   somewhere), and a region close to Bangladesh (e.g. Singapore).
3. Once the project is ready, open **SQL Editor** (left sidebar) → **New query**.
4. Open [`supabase/schema.sql`](supabase/schema.sql) in this project, copy its
   entire contents, paste into the SQL Editor, and click **Run**. This creates
   all tables, security rules, and helper functions.
5. Go to **Project Settings → API**. You'll need three values for Step 3:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click "Reveal" — keep this secret, never share it)

## Step 2 — Set up Google sign-in (optional but recommended)

Google sign-in lets people log in with one tap using the Google account
already on their phone — no password to create or forget.

1. In Supabase: **Authentication → Providers → Google** → toggle it on.
2. You'll need a Google OAuth Client ID/Secret. Follow Supabase's guide:
   https://supabase.com/docs/guides/auth/social-login/auth-google
   (Briefly: go to Google Cloud Console → create a project → OAuth consent
   screen → Credentials → Create OAuth Client ID → Web application → add the
   Authorized redirect URI Supabase shows you.)
3. Paste the Client ID and Secret into Supabase and save.

If you skip this, email/password login still works fine — Google is just a
nicer experience for less tech-savvy users.

## Step 3 — Add your environment variables

1. Copy `.env.example` to a new file named `.env.local`.
2. Fill in the three Supabase values from Step 1.
3. Leave `SMS_API_KEY` empty for now — the site works fully without it
   (donor phone verification and SMS alerts just get skipped). You can add
   SMS later at any time — see **Step 5**.
4. Set `NEXT_PUBLIC_HELPLINE_PHONE` to a real phone number — this is shown in
   the footer for people who can't use the site and need a volunteer to call.

Restart `npm run dev` after editing `.env.local`.

## Step 4 — Make yourself an admin

1. Open the site, click **Log In**, sign in (Google or email).
2. Click **Become a Donor** and complete the registration form once — this
   creates your profile row.
3. Back in Supabase **SQL Editor**, run:
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'your-login-email@example.com');
   ```
4. Reload the site — you'll now see an **Admin** link where you can verify
   donors (after calling to confirm their details) and manage requests.

## Step 5 — Turn on SMS (optional, ≤ $5/month)

The site works without SMS — donor registration and request posting are
fully functional either way. Adding SMS gets you:
- Automatic phone number verification (OTP) when someone registers
- Automatic SMS alerts to matching donors when an urgent request is posted

**To turn it on:**

1. Sign up at one of these Bangladeshi bulk SMS gateways (both prepaid, no
   monthly fee — you only pay for what you recharge):
   - https://sms.net.bd (Alpha SMS) — non-masking SMS ~0.30৳ each
   - https://bulksmsbd.net — similar pricing
2. Recharge a small amount, e.g. 500৳ (~$4) — this is your entire monthly
   budget and it is impossible to spend more, since it's prepaid.
3. Get your API key from the gateway's dashboard.
4. In `.env.local`, set:
   ```
   SMS_PROVIDER=smsnetbd        # or "bulksmsbd"
   SMS_API_KEY=your-api-key-here
   SMS_SENDER_ID=                # only needed for bulksmsbd
   SMS_MONTHLY_CAP=1800          # hard stop — site keeps working, alerts just pause
   ```
5. Restart the server. The Admin panel now shows a live SMS spend meter.

Bangla SMS costs more per character than English (70 chars/segment vs 160),
so all message templates in [`src/lib/sms.ts`](src/lib/sms.ts) are kept short
on purpose. Don't lengthen them without checking the segment count.

## Step 5b — Daily automation (optional, free)

A once-a-day background job ([`src/app/api/cron/daily/route.ts`](src/app/api/cron/daily/route.ts))
does two things automatically:
- Texts donors an "you can donate again" reminder the moment they cross the
  90-day mark (only if SMS is turned on)
- Marks blood requests as expired once their "needed by" date has passed, so
  the request board never shows dead requests

This only runs once deployed on Vercel (there's no cron on your own machine).
To enable it:

1. Add a `CRON_SECRET` environment variable in Vercel — any random string
   works (e.g. run `openssl rand -hex 24` or ask a password generator).
   Vercel automatically sends it as a Bearer token to your own cron job, so
   this keeps the endpoint from being triggered by anyone else.
2. That's it — [`vercel.json`](vercel.json) already schedules the job daily
   at 3am UTC (9am Bangladesh time). It's included on Vercel's free plan.

If you skip this step, everything else on the site still works exactly the
same — requests just won't auto-expire and reminders won't go out.

## Step 5c — Web push notifications (optional, free — no SMS budget used)

A free complement to SMS: donors who enable it on their dashboard get a
phone notification the moment a matching blood request is posted, at no
per-message cost (unlike SMS, there's no cap needed).

1. Generate a VAPID keypair once:
   ```bash
   node -e "console.log(require('web-push').generateVAPIDKeys())"
   ```
2. Add to `.env.local` (and later to Vercel's environment variables):
   ```
   VAPID_PUBLIC_KEY=<publicKey from above>
   VAPID_PRIVATE_KEY=<privateKey from above>
   VAPID_SUBJECT=mailto:you@example.com
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same publicKey — this one is safe to expose>
   ```
3. Restart the server. Donors will see an "Enable" button for push
   notifications on their dashboard.

Skip this and the button on the dashboard just won't appear — nothing else
changes.

## Step 5d — Profile photos & donor stories (optional, free)

Lets donors upload a profile photo (shown everywhere they appear on the
site) and share a short story about their donation experience, with an
optional photo, on the new `/testimonials` page. Stories are held for admin
approval before they go public.

Uploads go straight from the visitor's browser to Cloudinary — never
through your server — so there's no file-size limit to worry about, and
every photo is automatically resized and compressed on the way in.

1. Sign up free at https://cloudinary.com (25 GB storage/bandwidth per
   month on the free tier — plenty for a town-sized site).
2. From the Cloudinary dashboard, copy your **Cloud name**, **API key**,
   and **API secret**.
3. Add to `.env.local` (and later to Vercel's environment variables):
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   ```
   `CLOUDINARY_API_SECRET` must stay server-only — never put it in a
   `NEXT_PUBLIC_` variable.
4. In Supabase SQL Editor, run
   [`supabase/migration_003_photos.sql`](supabase/migration_003_photos.sql)
   (adds the `avatar_url` column and the `testimonials` table).
5. Restart the server. Donors now see a photo picker on their dashboard,
   and a "Share Story" form on `/testimonials`.

Skip this and the photo pickers just won't appear — nothing else changes.

## Step 6 — Deploy for free on Vercel

1. Push this project to a new GitHub repository (see commands below).
2. Go to https://vercel.com, sign up with GitHub, click **Add New → Project**,
   import your repo.
3. In the **Environment Variables** section, paste in everything from your
   `.env.local` (including the SMS ones if you set them up). Set
   `NEXT_PUBLIC_SITE_URL` to the `https://your-project.vercel.app` URL Vercel
   gives you.
4. Click **Deploy**. Your site is now live at a free `.vercel.app` address.
5. Back in Supabase → **Authentication → URL Configuration**, add your Vercel
   URL to **Redirect URLs** (needed for Google login to work in production).

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/savar-blood.git
git push -u origin main
```

## Project structure

- `supabase/schema.sql` — the entire database: tables, security rules (Row
  Level Security), and triggers. Re-run in the SQL Editor any time you need
  to inspect what's protecting the data.
- `src/lib/sms.ts` — the SMS sending module. Provider-agnostic; switching
  gateways is a small edit here.
- `src/lib/constants.ts` — Savar area list, hospital list, budget/limit knobs
  (e.g. `MAX_OPEN_REQUESTS_PER_USER`, `ALERT_DONORS_PER_REQUEST`).
- `messages/bn.json` / `messages/en.json` — every piece of UI text. Add a new
  page's text here in both files.
- `src/app/[locale]/` — all pages (home, search, register, requests,
  dashboard, admin, login).

## Who to call if something breaks

Supabase and Vercel free tiers are generous for a town-sized site (this app
will likely use well under 1% of the free quotas), but if you ever hit a
limit or something looks wrong, check:
- Supabase **Dashboard → Reports** for database usage
- Vercel **Dashboard → your project → Logs** for errors
