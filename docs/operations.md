# Operations Guide — Badminton Pro Shop

How to configure, deploy, test, and maintain the app end-to-end.

---

## 1. Architecture Overview

```
iPad (Safari) ──► GitHub Pages (static React app)
                        │
                        ▼
               Supabase (PostgreSQL)
                        │
                        ├── REST API (supabase-js reads/writes orders + catalog)
                        └── Edge Function (send-order-notification → Resend → email)
```

No backend server to manage. Everything runs through Supabase.

---

## 2. Required Credentials

You need three things before the app works:

| Credential | Where to get it | Used by |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project → Settings → API → Project URL | Frontend (Vite build) |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project → Settings → API → Authentication keys → **publishable** | Frontend (Vite build) |
| `VITE_STAFF_PIN` | You choose (default: `1234`) | Frontend (Vite build) |
| `RESEND_API_KEY` | resend.com → API Keys | Supabase Edge Function (server-side only) |
| `FROM_EMAIL` | `onboarding@resend.dev` for testing, or your verified domain | Supabase Edge Function |
| `SHOP_NAME` | e.g. `Badminton Pro Shop` | Supabase Edge Function |

The first three are client-side — they go in `.env.local` and as GitHub Actions secrets.
The last three are server-side — they go in Supabase's secret store only, never in `.env`.

---

## 3. Local Setup

### 3a. Install dependencies

```powershell
npm install
```

### 3b. Configure environment

Copy the example and fill in your values:

```powershell
copy .env.example .env.local
```

Edit `.env.local`:

```
VITE_SUPABASE_URL=https://rtkzsmngyeqcadvltipy.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxx
VITE_STAFF_PIN=1234

# Only needed if testing edge functions locally (supabase functions serve)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=onboarding@resend.dev
SHOP_NAME=Badminton Pro Shop
```

### 3c. Run locally

```powershell
npm run dev
```

App runs at http://localhost:5173/badminton-shop-management/
Staff view: http://localhost:5173/badminton-shop-management/#/staff

---

## 4. Supabase Backend Setup

### 4a. Run the schema

1. Go to **Supabase Dashboard → SQL Editor**
2. Paste the full contents of `supabase/schema.sql`
3. Click **Run**

This creates all tables and seeds the catalog (Yonex, Victor, BG80, Aerobite, etc.).

To verify it worked:

```sql
select count(*) from racket_brands;   -- expect 5
select count(*) from racket_models;   -- expect ~25
select count(*) from string_brands;   -- expect 4
select count(*) from string_models;   -- expect ~18
```

### 4b. Deploy the edge function

Requires Supabase CLI (`npm install -g supabase`) and login:

```powershell
supabase login
supabase link --project-ref rtkzsmngyeqcadvltipy
supabase functions deploy send-order-notification
```

### 4c. Set edge function secrets

```powershell
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx FROM_EMAIL=onboarding@resend.dev SHOP_NAME="Badminton Pro Shop"
```

Verify they were saved:

```powershell
supabase secrets list
```

Secrets take effect immediately — no redeploy needed.

---

## 5. GitHub Actions Deployment

The workflow in `.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main`.

### Required GitHub Actions secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

Add these three secrets exactly:

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://rtkzsmngyeqcadvltipy.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your publishable anon key |
| `VITE_STAFF_PIN` | `1234` |

> **Note:** Resend secrets are NOT added here — they live in Supabase only.

### Enable GitHub Pages

Go to: **GitHub repo → Settings → Pages → Source → GitHub Actions**

### Trigger a deploy

```powershell
git add .
git commit -m "deploy"
git push origin main
```

Check progress at: **GitHub repo → Actions tab**

Deployed URL: `https://<your-username>.github.io/badminton-shop-management/`

---

## 6. End-to-End Test Run

Walk through this checklist after every deploy.

### Customer flow

1. Open the deployed URL on any browser
2. You should see the kiosk welcome screen (dark navy, shuttlecock logo, "Drop Off Racket" button)
3. Tap **Drop Off Racket**
4. Step 1 — Select racket brand: dropdown should populate (Yonex, Victor, Li-Ning, etc.)
5. Select a brand → racket models dropdown populates
6. Tap **Next**
7. Step 2 — Select string brand → models load → set tension with slider
8. Tap **Next**
9. Step 3 — Enter name (required), phone and email (optional)
10. Tap **Next**
11. Step 4 — Review summary → tap **Submit Order**
12. Confirmation screen shows with order ID (e.g. `#A1B2`)
13. Tap **New Order** → returns to home

### Staff flow

1. Scroll to the bottom of the home screen → tap **Staff**
2. PIN keypad appears → enter `1234`
3. Staff dashboard loads
4. Tap **Order Queue** → the order you just placed should appear
5. Tap the status badge → cycles: **Pending → In Progress → Done → Picked Up**
6. Tap **Lock** → returns to PIN gate

### Email test (if Resend is configured)

Place an order with a real email address. Check:
- Inbox for **order confirmation** email (sent on submit)
- Inbox for **ready for pickup** email (sent when staff marks order Done)

---

## 7. Testing the Edge Function Directly

### Against production

Get your anon key from Supabase Dashboard → Settings → API → Authentication keys → publishable.

```powershell
$body = '{"type":"order_created","order":{"id":"11111111-2222-3333-4444-555566667777","customer_name":"Alice Tran","customer_email":"your@email.com","racket_brand_name":"Yonex","racket_model_name":"Astrox 99","string_brand_name":"Yonex","string_model_name":"BG80","tension_lbs":26,"notes":""}}'

curl -i -X POST "https://rtkzsmngyeqcadvltipy.supabase.co/functions/v1/send-order-notification" `
  -H "Authorization: Bearer <ANON_KEY>" `
  -H "Content-Type: application/json" `
  -d $body
```

Expected: `200 OK` with `{"id":"xxxx-..."}` — check your inbox.

### Against local (requires Docker Desktop running)

Get local anon key:

```powershell
supabase status -o env
# Copy the ANON_KEY= value
```

Start local function:

```powershell
supabase functions serve send-order-notification --env-file .env.local
```

Send test request:

```powershell
$body = '{"type":"order_created","order":{"id":"11111111-2222-3333-4444-555566667777","customer_name":"Alice Tran","customer_email":"your@email.com","racket_brand_name":"Yonex","racket_model_name":"Astrox 99","string_brand_name":"Yonex","string_model_name":"BG80","tension_lbs":26,"notes":""}}'

curl -i http://127.0.0.1:54321/functions/v1/send-order-notification `
  -H "Authorization: Bearer <LOCAL_ANON_KEY>" `
  -H "Content-Type: application/json" `
  -d $body
```

Check email at **Mailpit**: http://127.0.0.1:54324 (emails are caught locally, not delivered).

---

## 8. iPad Kiosk Setup

### Install as home screen app

1. Open the deployed URL in **Safari** on the iPad
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Name it **Pro Shop** → tap **Add**
5. The app now launches fullscreen (no browser chrome) from the home screen

### Lock to kiosk mode (Guided Access)

Prevents customers from leaving the app or accessing other iPad functions.

1. **Settings → Accessibility → Guided Access** → turn on
2. Set a Guided Access passcode (different from the staff PIN)
3. Open the Pro Shop app from the home screen
4. Triple-click the **side button** → tap **Start**
5. iPad is now locked to the app

To exit: triple-click side button → enter Guided Access passcode → tap **End**.

### Recommended iPad settings

| Setting | Value | Why |
|---|---|---|
| Auto-Lock | Never | Prevents screen sleeping mid-order |
| Display Brightness | ~80% | Visible in a bright shop |
| Text Size | Default | Form is designed for default size |
| Orientation lock | Portrait or Landscape | App works in both |

---

## 9. Ongoing Maintenance

### Add new rackets or strings

Use the **Inventory** tab in the staff view (PIN → Staff Dashboard → Inventory).
Changes take effect immediately — no deploy needed.

### Change the staff PIN

Update the `VITE_STAFF_PIN` secret in GitHub Actions and push any commit to trigger a redeploy.
Also update `.env.local` for local dev.

### View order history

Go to **Supabase Dashboard → Table Editor → stringing_orders**.
Orders are never deleted automatically.

### Check edge function logs

**Supabase Dashboard → Edge Functions → send-order-notification → Logs**

Useful for debugging failed email sends.

### Redeploy after code changes

```powershell
git add .
git commit -m "your change"
git push origin main
```

GitHub Actions deploys automatically. Takes ~1 minute.

### Update the schema (add columns etc.)

Run SQL directly in **Supabase Dashboard → SQL Editor**.
The app doesn't run migrations automatically — apply changes manually and update `supabase/schema.sql` to keep it in sync.

---

## 10. Common Issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Dropdowns empty on kiosk form | Schema not run / wrong Supabase URL | Check `.env.local`, run schema.sql |
| Order submits but no confirmation | Supabase insert failing | Check browser console, verify anon key |
| Staff PIN not working | `VITE_STAFF_PIN` not set in build | Add secret to GitHub Actions, redeploy |
| Email not received | Resend key not set or FROM_EMAIL unverified | Run `supabase secrets list`, check Edge Function logs |
| App shows blank page on iPad | GitHub Pages not enabled or wrong base URL | Enable Pages → GitHub Actions in repo settings |
| Edge function returns 401 | Missing Authorization header | Include `Authorization: Bearer <anon_key>` in curl |
| Edge function returns 500 "RESEND_API_KEY not set" | Secret not set, or local `.env.local` missing it | `supabase secrets set RESEND_API_KEY=...` or update `.env.local` and restart serve |
