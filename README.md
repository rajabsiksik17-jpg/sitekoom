# Sitekoom Corporate Digital Platform

منصة رقمية متكاملة لشركة **سايتكم / Sitekoom** — موقع شركة + بورتفوليو + CMS + إدارة عملاء (Leads) + محادثة مباشرة + تحليلات + SEO في نظام واحد.

A complete production-ready platform: Corporate Website + Portfolio + CMS + Lead Management + Live Chat + Analytics + SEO.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14 (App Router, SSR/SSG) + React 18 + TypeScript |
| Styling | Tailwind CSS (custom purple/violet identity) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime (Postgres Changes + Broadcast) |
| Storage | Supabase Storage |
| Charts | Recharts |
| Email | Provider abstraction (Console / Resend / SMTP via Nodemailer) |
| Validation | Zod |

## Features

- **Bilingual (AR default + EN) with full RTL/LTR** — clean, SEO-friendly URLs (`/services`, `/en/services`).
- **Dynamic CMS**: services, projects, articles, sliders, homepage sections, marquee, company info, team, statistics, social links, settings — all editable from the admin without touching code.
- **RBAC**: Super Admin, Partial Admin (permission matrix), Communication Manager (live chat only). Enforced at DB (RLS) + app + route level.
- **Lead/CRM**: contact requests with source/page/service attribution, UTM tracking, status, priority, assignment, internal notes, CSV export.
- **Realtime Live Chat**: visitor queue → agent accepts → realtime messaging with typing indicator, transfer, close.
- **SEO**: per-entity & per-locale metadata, sitemap.xml, robots.txt, JSON-LD (Organization, LocalBusiness, WebSite, Service, Article, FAQ, Breadcrumb), Open Graph, Twitter Cards, Google Search Console / Analytics / Tag Manager integration.
- **Analytics**: internal event tracking + charts + period filters.
- **Media Library**, **Notifications**, **Audit Log**, **Settings**, **Integrations**.

---

## Project Structure

```
sitekoom/
├── supabase/
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql   # Tables, RLS, RBAC functions, triggers, realtime
│   │   └── 0002_storage.sql          # Storage buckets + policies
│   └── seed.sql                      # Roles, permissions, services, projects, articles, settings
├── scripts/
│   └── create-admin.mjs              # Create the demo Super Admin
├── src/
│   ├── app/
│   │   ├── [locale]/                 # Public site (ar default, en prefixed)
│   │   ├── admin/                    # Admin dashboard (protected)
│   │   ├── api/                      # Route handlers (contact, chat, admin users)
│   │   ├── sitemap.xml/route.ts
│   │   ├── robots.txt/route.ts
│   │   └── layout.tsx / globals.css
│   ├── components/                   # Shared + admin components
│   ├── lib/                          # supabase clients, auth, rbac, queries, email, seo, ...
│   └── middleware.ts                 # Locale routing + session refresh + admin protection
├── .env.example
└── package.json
```

---

## Getting Started (Local)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at https://supabase.com and copy:
   - Project URL
   - Anon public key
   - Service role key

3. **Configure environment variables**

   Copy `.env.example` → `.env.local` and fill in:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Set up the database**

   Open the Supabase **SQL Editor** and run, in order:

   1. `supabase/migrations/0001_initial_schema.sql`
   2. `supabase/migrations/0002_storage.sql`
   3. `supabase/seed.sql`

   (Or use the Supabase CLI: `supabase db push` then `supabase db seed`.)

5. **Create the demo Super Admin** (development only)

   ```bash
   node scripts/create-admin.mjs admin@sitekoom.com "ChangeMe123!" "Site Admin"
   ```

   > Never run this with a real password in production.

6. **Run**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 (Arabic) and http://localhost:3000/en (English).
   Admin: http://localhost:3000/admin

---

## Supabase Setup Checklist

- [ ] **Database**: run migrations `0001_initial_schema.sql` then `0002_storage.sql`.
- [ ] **Seed**: run `seed.sql` (roles, permissions, 8 core services, demo projects/articles, settings, social links).
- [ ] **Realtime**: the migration adds `live_chat_conversations`, `live_chat_messages` and `notifications` to the `supabase_realtime` publication automatically.
- [ ] **Storage**: `0002_storage.sql` creates `media` and `avatars` public buckets with admin-only write policies (guarded by `media.manage` permission).
- [ ] **Auth**: enable **Email** provider in *Authentication → Providers*. Configure the Site URL to your production domain.
- [ ] **RLS**: all tables have Row Level Security enabled. Public (anon) can only read published content and insert contact/chat/analytics rows. Admin tables are guarded by `has_permission(...)`.

> **Security note**: the `SUPABASE_SERVICE_ROLE_KEY` is used **only** in server-side code (`src/lib/supabase/admin.ts`, API routes). It is never exposed to the browser.

---

## Roles & Permissions

Three seeded roles:

| Role | Scope |
| --- | --- |
| **Super Admin** (`super_admin`) | Full access (bypasses permission matrix). |
| **Partial Admin** (`partial_admin`) | Content management; permissions editable in *Roles & Permissions*. |
| **Communication Manager** (`communication_manager`) | Live chat only. Cannot access `/admin/services` etc. — enforced at backend (RLS) + frontend (route guards). |

Permission groups: dashboard, contacts, chat, services, projects, articles, homepage, company, social, media, seo, analytics, notifications, users, roles, settings, integrations, audit.

---

## Email Setup

The email layer is a provider abstraction (`src/lib/email/index.ts`). Set `EMAIL_PROVIDER`:

- `console` — logs emails to the server console (default, for development).
- `resend` — set `RESEND_API_KEY` (REST API, no extra dependency).
- `smtp` — set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

The destination email for contact/lead notifications is configured in **Admin → Settings → Contact** (or the `contact` settings key).

---

## Deployment (Hostinger + Supabase)

1. **Build**

   ```bash
   npm run build
   ```

2. **Set environment variables** on Hostinger (same as `.env.example`, with production `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`).

3. **Deploy** the built output as a Node.js app:

   ```bash
   npm run start
   ```

   Hostinger supports Node.js apps; point the document root/start command to `npm run start` after `npm install && npm run build`.

4. **Supabase**: point your domain's **Site URL** in *Authentication → URL Configuration*, and add your domain to *API → URL configuration* if needed.

5. **Storage CORS** (if uploads are blocked from the browser): add your production origin to the `media` and `avatars` bucket CORS configuration in Supabase.

6. **SEO post-launch**:
   - Add the Google Search Console verification code in **Admin → Integrations**.
   - Add the Google Analytics `G-XXXXXXX` ID and GTM container ID in **Admin → Integrations** (loaded automatically).
   - `/sitemap.xml` and `/robots.txt` are generated automatically from published content.

---

## Notes

- **Demo data** in `seed.sql` is clearly marked with `مثال:` / `Demo:` prefixes (sample projects & articles) so it can be identified and deleted easily. The core services are real and intended to stay.
- All sensitive operations (contact submission, chat start, user creation, password reset) go through server-side API routes using the service role.
- Realtime updates (chat, notifications, dashboard) work without page refresh.
