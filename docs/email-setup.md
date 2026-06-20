# Email Notification Setup

The `send-order-notification` Supabase Edge Function sends transactional emails via [Resend](https://resend.com) at two points in the order lifecycle:

| Trigger | Recipient | Email |
|---|---|---|
| Customer submits an order | Customer (if email provided) | Order confirmed — racket / string / tension / order ID |
| Staff marks order **Done** | Customer (if email was provided) | Racket ready for pickup |

Email failures are **silent** — they never block the order flow.

---

## 1. Get a Resend API Key

1. Create a free account at <https://resend.com> — free tier is 3 000 emails/month.
2. In the Resend dashboard go to **API Keys → Create API Key**.
3. Name it `badminton-shop` and copy the key (`re_xxxxxxxxxxxx`). You won't see it again.

### Sending domain

| Scenario | FROM_EMAIL to use |
|---|---|
| Demo / testing | `onboarding@resend.dev` — works immediately, no domain needed |
| Production | A domain you own, verified in Resend — see below |

**To verify your own domain (production):**

1. In Resend go to **Domains → Add Domain** and enter e.g. `yourshop.co.nz`.
2. Resend gives you DNS records (TXT + MX). Add them in your DNS provider (Cloudflare, GoDaddy, etc.).
3. Click **Verify** — usually propagates in under 5 minutes.
4. Once verified, `FROM_EMAIL` can be any address at that domain, e.g. `noreply@yourshop.co.nz`.

---

## 2. Install the Supabase CLI

Pick one method:

```bash
# macOS — Homebrew (recommended)
brew install supabase/tap/supabase

# Any platform — npm
npm install -g supabase

# Windows — direct download (PowerShell, run as admin)
winget install Supabase.CLI
# or download the .exe from https://github.com/supabase/cli/releases/latest
```

Verify:

```bash
supabase --version
# Expected: supabase version 2.x.x
```

---

## 3. Link the CLI to Your Supabase Project

### 3a. Log in

```bash
supabase login
# Opens a browser tab — approve access, then return to the terminal
```

### 3b. Link to the project

```bash
cd /path/to/badminton-shop-management

supabase link --project-ref <YOUR_PROJECT_REF>
```

Your project ref is the string after `https://supabase.com/dashboard/project/` in the Supabase dashboard URL (looks like `abcdefghijklmnop`).

You can also find it at: **Supabase Dashboard → Project Settings → General → Reference ID**.

When prompted for the database password, use the one you set when creating the project (or reset it in **Settings → Database → Reset database password**).

---

## 4. Deploy the Edge Function

```bash
supabase functions deploy send-order-notification
```

Expected output:

```
Deploying function send-order-notification...
✓ Done: https://<ref>.supabase.co/functions/v1/send-order-notification
```

### 4a. Set the secrets

```bash
supabase secrets set \
  RESEND_API_KEY=re_xxxxxxxxxxxx \
  FROM_EMAIL=onboarding@resend.dev \
  SHOP_NAME="Badminton Pro Shop"
```

For production with your own domain:

```bash
supabase secrets set \
  RESEND_API_KEY=re_xxxxxxxxxxxx \
  FROM_EMAIL=noreply@yourshop.co.nz \
  SHOP_NAME="Your Shop Name"
```

Verify the secrets were saved:

```bash
supabase secrets list
```

> **Do not put these values in `.env`** — that file is for client-side Vite variables. Edge Function secrets live only in Supabase's secret store.

---

## 5. Test Locally with `supabase functions serve`

Local testing lets you iterate fast without deploying. Requires Docker Desktop to be running.

```powershell
# In the project root
supabase functions serve send-order-notification --env-file .env.local
```

Create `.env.local` in the project root (never commit this — it's already in `.gitignore`):

```
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=onboarding@resend.dev
SHOP_NAME=Badminton Pro Shop
```

The function will be available at `http://127.0.0.1:54321/functions/v1/send-order-notification`.

Get the local anon key:

```powershell
supabase status -o env
# Look for: ANON_KEY=eyJ...
```

Send a test request (PowerShell — use backtick `` ` `` for line continuation, not `\`):

```powershell
curl -i http://127.0.0.1:54321/functions/v1/send-order-notification `
  -H "Authorization: Bearer <ANON_KEY_FROM_SUPABASE_STATUS>" `
  -H "Content-Type: application/json" `
  -d '{\"type\": \"order_created\", \"order\": {\"id\": \"11111111-2222-3333-4444-555566667777\", \"customer_name\": \"Alice Tran\", \"customer_email\": \"alice@example.com\", \"racket_brand_name\": \"Yonex\", \"racket_model_name\": \"Astrox 99\", \"string_brand_name\": \"Yonex\", \"string_model_name\": \"BG80\", \"tension_lbs\": 26, \"notes\": \"\"}}'
```

Check **Mailpit** at http://127.0.0.1:54324 — emails are caught locally and never delivered for real.

Expected response (email sent):

```json
{ "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
```

Expected response (no email, skipped silently):

```json
{ "skipped": "no customer email" }
```

---

## 6. Test in Production with curl

Use the deployed function URL from the Supabase dashboard (**Edge Functions → send-order-notification → URL**).

You need the **anon key** from **Settings → API → Authentication keys → publishable**.

### Test: order_created

```bash
curl -i \
  -X POST "https://<ref>.supabase.co/functions/v1/send-order-notification" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order_created",
    "order": {
      "id": "11111111-2222-3333-4444-555566667777",
      "customer_name": "Alice Tran",
      "customer_email": "alice@example.com",
      "racket_brand_name": "Yonex",
      "racket_model_name": "Astrox 99",
      "string_brand_name": "Yonex",
      "string_model_name": "BG80",
      "tension_lbs": 26,
      "notes": ""
    }
  }'
```

### Test: order_done

```bash
curl -i \
  -X POST "https://<ref>.supabase.co/functions/v1/send-order-notification" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order_done",
    "order": {
      "id": "11111111-2222-3333-4444-555566667777",
      "customer_name": "Alice Tran",
      "customer_email": "alice@example.com",
      "racket_brand_name": "Yonex",
      "racket_model_name": "Astrox 99",
      "string_brand_name": "Yonex",
      "string_model_name": "BG80",
      "tension_lbs": 26,
      "notes": ""
    }
  }'
```

A `200` response with a Resend email ID means the email is on its way. Check the **Resend dashboard → Emails** tab to confirm delivery.

---

## 7. Common Errors and Fixes

### Error: "Invalid API key"
```json
{ "statusCode": 401, "message": "Invalid API key" }
```
**Fix:** The `RESEND_API_KEY` secret is wrong or not set. Run `supabase secrets list` to confirm it's there, then re-set it with `supabase secrets set RESEND_API_KEY=re_xxx`.

---

### Error: "You can only send testing emails to your own email address"
```json
{ "statusCode": 403, "message": "You can only send testing emails to your own email address." }
```
**Fix:** You're using `onboarding@resend.dev` as `FROM_EMAIL` and trying to send to a third-party address. In Resend's free sandbox mode with the test sender, you can only email yourself. Either:
- Use your own email as the recipient during testing, or
- Verify a domain in Resend and switch `FROM_EMAIL` to `noreply@yourdomain.com`.

---

### Error: "The from address is not verified"
```json
{ "statusCode": 403, "message": "The from address domain is not verified." }
```
**Fix:** Your `FROM_EMAIL` domain hasn't been verified in Resend. Use `onboarding@resend.dev` for now or complete domain verification (Section 1 above).

---

### Browser shows a CORS error when calling the function
The function returns CORS headers on all responses including errors. If you see a CORS error it usually means:
- The function threw before the CORS headers were sent (e.g. a top-level crash at cold start). Check the **Supabase Dashboard → Edge Functions → Logs** for the real error.
- The `Authorization` header is missing. Edge Functions require the anon key header: `Authorization: Bearer <anon_key>`.

---

### 500 with no body / function times out
This typically means the function crashed at the very top (import error, syntax error) before any response was sent. Check:
1. **Logs:** Supabase Dashboard → Edge Functions → Logs — look for `Error` lines.
2. Re-deploy after fixing: `supabase functions deploy send-order-notification`.

---

### Cold start latency (first request after deploy is slow)
Edge Functions have a ~300–800 ms cold start on the first invocation after deploy or after a period of inactivity. This is normal. For the email use-case it's invisible to the customer because the email is sent fire-and-forget after the order is saved.

---

### Function deployed but secrets aren't available
Secrets set **after** deploying are picked up immediately (no redeploy needed) — Deno reads them fresh on each invocation. If you set a secret and it's still not working, check the spelling in `supabase secrets list` versus what the function reads (`RESEND_API_KEY`, `FROM_EMAIL`, `SHOP_NAME`).

---

## How the App Calls the Function

The function is invoked from the React frontend using the Supabase client's `functions.invoke()`:

```js
import { supabase } from '../supabaseClient'

await supabase.functions.invoke('send-order-notification', {
  body: { type: 'order_created', order },
})
```

The client automatically attaches the anon key as the `Authorization` header. Failures are caught and ignored — they never block the order save.
