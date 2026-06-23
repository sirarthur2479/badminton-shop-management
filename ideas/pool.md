# Idea Pool

Drop anything here — rough thoughts, half-baked ideas, links, quotes, observations.
No structure required. Run `/intake` when you're ready to act on something.

---

## [2026-06-23] Set up vitest test framework
No test runner is currently configured. Add vitest + @testing-library/react so the
TDD skill has a working RED gate. Also add jsdom for component tests.
Priority: do this first — it's a dependency for every TDD task.

---

## [2026-06-23] Fix sticky Next/Submit button on mobile
Button falls below fold on iPhone 14 Pro — user must scroll to tap it.
Fix: `h-[100dvh]` container + scrollable field area so the button is always pinned
visible without scrolling. Affects `StringingOrderForm.jsx`.

---

## [2026-06-23] Add queue filter tabs
All orders show in one flat list — `picked_up` orders pile up and make the active
queue hard to scan. Add filter tabs: Pending / In Progress / Done / All.
Affects `OrderQueue.jsx`.

---

## [2026-06-23] NZD formatting and NZ date format
Prices in inventory show no currency symbol. Dates display in US format (Jun 20, 01:23 PM).
Fix: all prices → `NZD $X.XX`, all dates → `20 Jun, 1:23 pm` (NZ locale).

---

## [2026-06-23] Returning customer search
No way to look up a prior order. Landing page should let customers search by name /
phone / email and pre-populate racket + string + tension from their last visit.
Players have 4–5 rackets and rarely change string — enter once, reuse forever.
Requires a `customers` table and `customer_id` FK on `stringing_orders`.

---

## [2026-06-23] Open catalog — "Not listed? Add it"
If a racket or string model isn't in the dropdown, customers are stuck.
Add a "Not listed? Add it" option at the bottom of each brand/model dropdown.
Submissions go into a staff review queue before going live. Catalog self-grows.

---

## [2026-06-23] Accessories / generic product catalog
Shops sell more than rackets and strings: grips, shuttlecocks, bags, etc.
Add a generic `products` table with a `category` field. Inventory manager gets
a category filter tab. No order-form integration in this phase — inventory only.

---

## [2026-06-23] SMS notification when order is done
Email only at the moment. Customers who don't check email miss the "ready" notification.
Twilio or a NZ-local SMS provider. High value for pickup flow.

---

## [2026-06-23] Print ticket — @media print order slip
No paper slip on drop-off. A `@media print` styled order card would let staff print
a ticket to attach to the racket, matching the physical workflow shops use today.

---

## [2026-06-23] Real-time queue — Supabase Realtime
Order queue only refreshes on manual button press. Subscribe to Supabase Realtime
so new orders appear instantly on the staff view without polling.
Affects `OrderQueue.jsx`.
