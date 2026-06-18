# Badminton Pro Shop — Project Plan

## What This Is

An iPad-optimized web app for a badminton pro shop with two modes:

1. **Kiosk Mode** (customer-facing, no auth): Customers self-register a racket stringing drop-off order via a multi-step form.
2. **Staff Mode** (PIN-protected): Staff manage the order queue and inventory (rackets, strings, brands, models).

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

Create a `.env` file in the project root (never commit this):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_STAFF_PIN=1234
```

Get the URL and anon key from: Supabase Dashboard → Project → Settings → API.

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

1. **Create Supabase project** and run `schema.sql`
2. **Add `.env`** with real credentials
3. **Test locally** with `npm run dev`
4. **Add more racket/string models** via the Inventory tab in Staff Mode
5. **Deploy**: Add a GitHub Actions workflow to build and push to `gh-pages` branch
6. **PWA**: Add `manifest.json` and service worker for offline support
7. **Notifications**: Optional — add email/SMS notification when order is done (Supabase Edge Functions + Resend/Twilio)
8. **Printing**: Add print-friendly order ticket view

---

## Key Design Decisions

- **Denormalized name fields** in `stringing_orders`: Preserves order history even if catalog items are later renamed or deleted.
- **Client-side PIN gate**: Simple enough for a single-location shop. For multi-staff or auditing needs, replace with Supabase Auth.
- **No TypeScript**: Kept plain JSX for simplicity and easier on-the-fly edits.
- **Cascading dropdowns**: Brand selection filters model list — prevents typos and keeps data clean.
