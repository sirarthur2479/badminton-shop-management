# Badminton Pro Shop — Project Plan

## Problem We're Solving

Auckland badminton pro shops have a recurring operational pain point:

- The **shop owner is often also a coach** — they're on court, not behind the counter
- The **shop is frequently unmanned** — customers drop off rackets and leave handwritten paper notes with their stringing request
- Paper notes get lost, misread, or forgotten — orders pile up with no visibility
- The owner comes back to a stack of rackets and has to manually sort out what each customer wants
- **The goal is to fulfil orders as fast as possible**, but the current paper-based system creates friction at every step

This app replaces the paper note with a self-service iPad kiosk. Customer registers their own order. Owner sees the queue from anywhere.

---

## Demo Plan (Current Focus)

The immediate goal is a working demo of the **core stringing registration flow** to show to Auckland pro shops.

### Demo Scope — What's In

| Feature | Why It's In |
|---|---|
| Customer self-registration kiosk | Replaces paper notes — this is the core value |
| 4-step order form (racket → string → tension → contact) | Structured data capture vs free-text notes |
| Order queue for staff/owner | Single view of all pending work, accessible from any device |
| One-tap status update (pending → in progress → done → picked up) | Owner can manage queue from phone while coaching |
| Order confirmation screen with order ID | Customer has a reference number to quote on pickup |

### Demo Scope — What's Out (deferred)

| Feature | Why It's Deferred |
|---|---|
| Inventory management (brands/models CRUD) | Too complex for a demo; pre-seed the catalog |
| Customer SMS/email notification | High value but needs Twilio/Resend setup — phase 2 |
| Print receipt / order ticket | Nice to have — phase 2 |
| PWA / offline support | Infrastructure concern — phase 2 |
| Multi-tenant / multi-shop | Platform concern — post-validation |
| Billing / Stripe | Post-validation |

### Demo Setup (Minimal)

Pre-seed the database with realistic Auckland shop catalog:
- 5 racket brands + ~10 popular models (Yonex Astrox 99, Victor Thruster, etc.)
- 4 string brands + ~8 popular strings (BG80, Aerobite, etc.) with realistic tension ranges

Staff mode PIN is `1234` for demo purposes — just enough to show the queue exists.

### Demo Flow to Show Shops

1. Hand shop owner the iPad → they see the kiosk welcome screen
2. Walk through placing a test order as a customer (2 minutes)
3. Open `/staff` on a phone → show the order appeared instantly in the queue
4. Tap the status badge → show it cycling through to "done"
5. Ask: "Does this match how you work today?"

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast HMR, small bundle, modern |
| Styling | Tailwind CSS v3 | Utility-first, easy iPad-sized touch targets |
| Database + API | Supabase (PostgreSQL) | Managed DB, REST API, no server to run |
| Routing | React Router v6 | Standard SPA routing |
| Hosting | GitHub Pages (static) | Free, already in use |

---

## Database Schema

Run `supabase/schema.sql` in the Supabase SQL editor to create all tables and seed data.

### Tables

**`racket_brands`** — Top-level racket brands (Yonex, Victor, Li-Ning, Babolat, Carlton)
- `id` uuid PK
- `name` text unique

**`racket_models`** — Specific models per brand (Astrox 99, Nanoflare 1000, etc.)
- `id` uuid PK
- `brand_id` uuid → racket_brands.id (cascade delete)
- `name` text
- `stock_qty` integer (default 0)
- `price` numeric(10,2)

**`string_brands`** — String brands (Yonex, Victor, Li-Ning, Ashaway)
- `id` uuid PK
- `name` text unique

**`string_models`** — Specific strings per brand (BG80, Aerobite, etc.)
- `id` uuid PK
- `brand_id` uuid → string_brands.id (cascade delete)
- `name` text
- `stock_qty` integer
- `price` numeric(10,2)
- `tension_min_lbs` integer
- `tension_max_lbs` integer

**`stringing_orders`** — Customer drop-off orders
- `id` uuid PK
- `created_at` timestamptz
- `customer_name` text (required)
- `customer_phone` text (optional)
- `customer_email` text (optional)
- `racket_brand_id` uuid → racket_brands.id
- `racket_model_id` uuid → racket_models.id
- `racket_brand_name` text (denormalized — displayed even if FK deleted)
- `racket_model_name` text (denormalized)
- `string_brand_id` uuid → string_brands.id
- `string_model_id` uuid → string_models.id
- `string_brand_name` text (denormalized)
- `string_model_name` text (denormalized)
- `tension_lbs` integer (required)
- `notes` text (optional)
- `status` text: `pending` | `in_progress` | `done` | `picked_up`

---

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`, never commit):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_STAFF_PIN=1234
```

Get the URL and anon key from: Supabase Dashboard → Project → Settings → API.

### Email (Supabase Edge Function secrets — not in .env)

The email function runs server-side. Set these via the Supabase CLI or Dashboard (Project → Edge Functions → Secrets):

```
RESEND_API_KEY=re_xxxxxxxxxxxx        # get from resend.com — free tier: 3000 emails/month
FROM_EMAIL=noreply@yourshop.co.nz     # must be a verified domain in Resend (use onboarding@resend.dev for testing)
SHOP_NAME=Your Shop Name              # appears in email header and from-name
```

Deploy the edge function:
```bash
supabase functions deploy send-order-notification
supabase secrets set RESEND_API_KEY=re_xxx FROM_EMAIL=noreply@yourshop.co.nz SHOP_NAME="Badminton Pro Shop"
```

### When emails are sent

| Trigger | Recipient | Email |
|---|---|---|
| Customer submits order | Customer (if email provided) | Order confirmed — shows racket, string, tension, order ID |
| Staff marks order as **Done** | Customer (if email was provided) | Racket ready for pickup |

Email failures are silent — they never block the order flow.

---

## Setup Instructions

### 1. Create Supabase project
1. Go to https://supabase.com and create a free account
2. Create a new project
3. In the SQL editor, paste and run the contents of `supabase/schema.sql`
4. Copy the project URL and anon key from Settings → API

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and desired staff PIN
```

### 3. Install and run
```bash
npm install
npm run dev
```

### 4. Deploy to GitHub Pages
```bash
npm run build
# Commit the dist/ folder or configure GitHub Actions to auto-deploy
```

### iPad Kiosk Setup
1. Open the deployed URL in Safari on iPad
2. Tap Share → "Add to Home Screen" to install as PWA (fullscreen)
3. Enable **Guided Access** (Settings → Accessibility → Guided Access) to lock iPad to this app

---

## File Structure

```
├── CLAUDE.md                          ← this file
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── supabase/
│   └── schema.sql
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx                        ← routes: / → Kiosk, /staff → Staff
    ├── supabaseClient.js              ← Supabase client + isConfigured()
    ├── pages/
    │   ├── KioskPage.jsx              ← toggles KioskHome / StringingOrderForm
    │   └── StaffPage.jsx              ← wraps StaffDashboard in PINGate
    └── components/
        ├── kiosk/
        │   ├── KioskHome.jsx          ← customer landing screen
        │   └── StringingOrderForm.jsx ← 4-step form (racket → string → info → confirm)
        ├── staff/
        │   ├── PINGate.jsx            ← 4-digit PIN keypad, reads VITE_STAFF_PIN
        │   ├── StaffDashboard.jsx     ← nav hub: Order Queue + Inventory tiles
        │   ├── OrderQueue.jsx         ← list orders, tap status to cycle it
        │   └── InventoryManager.jsx   ← CRUD tabs for all 4 catalog tables
        └── shared/
            ├── Button.jsx             ← primary/secondary/danger variants
            └── SelectField.jsx        ← styled select with label + disabled state
```

---

## Current Build Status

- [x] Full scaffolding committed
- [x] All components implemented (kiosk form, staff queue, inventory CRUD)
- [x] Database schema + seed data ready
- [ ] Supabase project not yet created (needs env vars)
- [ ] Not yet deployed to GitHub Pages
- [ ] PWA manifest not yet added

---

## Next Steps

### Phase 0 — Demo Ready (do this now)

1. **Create Supabase project** and run `schema.sql`
2. **Add `.env`** with real credentials + `VITE_STAFF_PIN=1234`
3. **Seed the catalog** — add realistic Auckland shop data: popular Yonex/Victor models, BG80/Aerobite strings
4. **Test locally** with `npm run dev` — walk through full order flow end-to-end
5. **Deploy to GitHub Pages** — get a shareable URL to open on the demo iPad + phone

### Phase 1 — After Pilot Feedback (2–3 shops)

6. **SMS notification** when order marked `done` — owner/customer gets a text (Twilio or NZ-local provider)
7. **Print ticket** — `@media print` order slip to hand customer on drop-off
8. **Staff queue mobile view** — ensure `/staff` order queue is fully usable on a phone (owner checking queue while coaching)
9. **NZD formatting** — add `NZD $` to all price fields

### Phase 2 — Productise

10. **Supabase Auth** — shop owner email login instead of env-var PIN
11. **Multi-tenant** — `shop_id` on all tables + RLS, one Supabase instance serves all shops
12. **Onboarding flow** — shop owner self-serves: sets shop name, logo, staff PIN, catalog
13. **PWA manifest + service worker** — install to iPad home screen, basic offline resilience
14. **Billing** — Stripe subscription (~$29–49 NZD/month per shop)

---

## Deployment Options

GitHub Pages free tier requires a **public repo**. Three options:

### Option A — Make repo public + GitHub Pages (simplest)
No secrets in the codebase (env vars are gitignored). Public is fine for a demo.
- Workflow: `.github/workflows/deploy.yml` already configured
- Enable: repo **Settings → Pages → Source → GitHub Actions**
- Add secrets: **Settings → Secrets and variables → Actions**

| Secret | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_STAFF_PIN` | `1234` |

Deployed URL: `https://<username>.github.io/badminton-shop-management/`

### Option B — Netlify (free, private repo)
1. Push to GitHub (repo stays private)
2. Connect at netlify.com → build command `npm run build`, publish dir `dist`
3. Add the 3 env vars in Netlify's UI
4. Auto-deploys on every push to main — no workflow file needed

### Option C — Vercel (free, private repo)
Same as Netlify. Zero config needed for Vite projects — connect repo, add env vars, done.

### Routing note
The app uses `HashRouter` so routes are `/#/` and `/#/staff`. This works on all three platforms without any server-side redirect rules.

---

## Key Design Decisions

- **Denormalized name fields** in `stringing_orders`: Preserves order history even if catalog items are later renamed or deleted.
- **Client-side PIN gate**: Simple enough for a single-location shop. For multi-staff or auditing needs, replace with Supabase Auth.
- **No TypeScript**: Kept plain JSX for simplicity and easier on-the-fly edits.
- **Cascading dropdowns**: Brand selection filters model list — prevents typos and keeps data clean.
