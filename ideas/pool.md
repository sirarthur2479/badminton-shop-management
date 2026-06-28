# Idea Pool

Drop anything here — rough thoughts, half-baked ideas, links, quotes, observations.
No structure required. Run `/intake` when you're ready to act on something.

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

---

## [2026-06-23] NZ legal compliance — privacy policy, data collection notices, unsubscribe
This app collects personal data (name, phone, email) and sends transactional emails.
Need to understand what NZ law actually requires: Privacy Act 2020, Fair Trading Act 1986,
Unsolicited Electronic Messages Act 2007, Consumer Guarantees Act 1993.
Research what website elements are legally required vs best-practice, then create a
compliance doc and any missing UI elements (privacy notice, unsubscribe link in emails, etc.).
