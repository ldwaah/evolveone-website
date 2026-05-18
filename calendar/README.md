# Calendar (White‑label booking page)

This folder is a **copy‑paste Calendly‑style booking page** you can reuse for client sites — **built by EvolveOne**, not an embed.

## Quick setup

1. Duplicate this `calendar/` folder into a new website.
2. Create a Supabase table for bookings (see below).
3. Set Netlify environment variables:
   - `RESEND_API_KEY`
   - `FROM_EMAIL` (e.g. `EvolveOne <no-reply@evolveone.ai>`)
   - `BOOKING_TO_EMAIL` (where bookings are sent)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Edit `calendar/config.js`:
   - `brandName`, `headline`, `subhead`
   - `booking.*` availability rules
5. Open `calendar/index.html`.

## Supabase table (SQL)

Run this in Supabase SQL editor:

```sql
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  notes text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  timezone_label text
);
```

## Notes

- This is a **static** page (no build step) + a Netlify Function at `/.netlify/functions/calendar-book`.
- Availability is generated in the browser from `calendar/config.js`.

